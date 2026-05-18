/* ─── DATA ─────────────────────────────────────────────── */
let productos = [], ingredientes = [], recetas = {}, pedidosConfirmados = [];
let nextIdProducto = 1, nextIdIngrediente = 1;
let carrito = [];

function cargarDatos() {
    const sp = localStorage.getItem("bendito_productos");
    const si = localStorage.getItem("bendito_ingredientes");
    const sr = localStorage.getItem("bendito_recetas");
    const sped = localStorage.getItem("bendito_pedidos");
    if (sp) { productos = JSON.parse(sp); nextIdProducto = Math.max(...productos.map(p => p.id), 0) + 1; }
    else {
        productos = [
            { id: 1, nombre: "Bolillo de yema", desc: "Pan tradicional esponjoso", precio: 3.50 },
            { id: 2, nombre: "Pastel de chocolate", desc: "Porción individual húmeda", precio: 18.00 },
            { id: 3, nombre: "Galleta de canela", desc: "Paquete de 3 unidades crujientes", precio: 6.00 }
        ]; nextIdProducto = 4;
    }
    if (si) { ingredientes = JSON.parse(si); nextIdIngrediente = Math.max(...ingredientes.map(i => i.id), 0) + 1; }
    else {
        ingredientes = [
            { id: 1, nombre: "Harina de trigo", unidad: "g" }, { id: 2, nombre: "Azúcar", unidad: "g" },
            { id: 3, nombre: "Huevo", unidad: "ud" }, { id: 4, nombre: "Mantequilla", unidad: "g" }
        ]; nextIdIngrediente = 5;
    }
    if (sr) recetas = JSON.parse(sr);
    else recetas = {
        1: [{ idIngrediente: 1, cantidad: 50 }, { idIngrediente: 2, cantidad: 5 }, { idIngrediente: 3, cantidad: 8 }],
        2: [{ idIngrediente: 1, cantidad: 70 }, { idIngrediente: 2, cantidad: 30 }, { idIngrediente: 3, cantidad: 15 }, { idIngrediente: 4, cantidad: 20 }],
        3: [{ idIngrediente: 1, cantidad: 40 }, { idIngrediente: 2, cantidad: 12 }, { idIngrediente: 3, cantidad: 5 }]
    };
    if (sped) {
        pedidosConfirmados = JSON.parse(sped);
        pedidosConfirmados.forEach((p, idx) => {
            if (!p.id) p.id = 'ped-' + (Date.now() - idx * 1000);
            if (!p.estado) p.estado = 'pendiente';
            if (!p.fechaCreacion) p.fechaCreacion = new Date().toISOString();
        });
    }
    guardarTodo();
}

function guardarTodo() {
    localStorage.setItem("bendito_productos", JSON.stringify(productos));
    localStorage.setItem("bendito_ingredientes", JSON.stringify(ingredientes));
    localStorage.setItem("bendito_recetas", JSON.stringify(recetas));
    localStorage.setItem("bendito_pedidos", JSON.stringify(pedidosConfirmados));
}

/* ─── PUBLIC MENU ──────────────────────────────────────── */
function renderizarMenu() {
    const grid = document.getElementById("productosGrid");
    grid.innerHTML = "";
    productos.forEach((p, idx) => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.style.animationDelay = `${idx * 0.06}s`;
        card.innerHTML = `
        <div class="product-name">${p.nombre}</div>
        <div class="product-desc">${p.desc || ""}</div>
        <div class="product-footer">
          <div class="product-price">L. ${p.precio.toFixed(2)}</div>
          <button class="btn-add" data-id="${p.id}">Agregar</button>
        </div>`;
        card.querySelector(".btn-add").addEventListener("click", () => agregarAlCarrito(p));
        grid.appendChild(card);
    });
}

/* ─── CARRITO ──────────────────────────────────────────── */
function agregarAlCarrito(prod) {
    const ex = carrito.find(i => i.id === prod.id);
    if (ex) ex.cantidad += 1;
    else carrito.push({ id: prod.id, nombre: prod.nombre, precio: prod.precio, cantidad: 1 });
    renderizarCarrito();
}

function cambiarQty(id, delta) {
    const idx = carrito.findIndex(i => i.id === id);
    if (idx === -1) return;
    carrito[idx].cantidad += delta;
    if (carrito[idx].cantidad <= 0) carrito.splice(idx, 1);
    renderizarCarrito();
}
window.cambiarQty = cambiarQty;

function renderizarCarrito() {
    const cont = document.getElementById("cartItemsContainer");
    const total = document.getElementById("cartTotal");
    if (!carrito.length) {
        cont.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>';
        total.textContent = "L. 0.00";
        return;
    }
    let html = "", sum = 0;
    carrito.forEach(item => {
        const sub = item.precio * item.cantidad;
        sum += sub;
        html += `<div class="cart-item">
        <div class="cart-item-name">${item.nombre}</div>
        <div class="qty-ctrl">
          <button class="qty-btn" onclick="cambiarQty(${item.id},-1)" aria-label="Reducir">−</button>
          <span class="qty-num">${item.cantidad}</span>
          <button class="qty-btn" onclick="cambiarQty(${item.id},1)" aria-label="Aumentar">+</button>
        </div>
        <div class="cart-item-price">L. ${sub.toFixed(2)}</div>
      </div>`;
    });
    cont.innerHTML = html;
    total.textContent = `L. ${sum.toFixed(2)}`;
}

function realizarPedido() {
    if (!carrito.length) { mostrarMsg("Agrega productos al carrito primero.", true); return; }
    const fecha = document.getElementById("fechaRecogida").value;
    const clienteNombre = document.getElementById("clienteNombre").value.trim();
    const clienteTelefono = document.getElementById("clienteTelefono").value.trim();
    const clienteNotas = document.getElementById("clienteNotas").value.trim();
    if (!fecha) { mostrarMsg("Selecciona una fecha de recogida.", true); return; }
    if (!clienteNombre) { mostrarMsg("Ingresa el nombre del cliente.", true); return; }
    if (!clienteTelefono) { mostrarMsg("Ingresa el teléfono del cliente.", true); return; }
    pedidosConfirmados.push({
        id: 'ped-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
        estado: 'pendiente',
        fechaCreacion: new Date().toISOString(),
        fecha,
        cliente: { nombre: clienteNombre, telefono: clienteTelefono, notas: clienteNotas },
        items: carrito.map(i => ({ productoId: i.id, nombre: i.nombre, cantidad: i.cantidad, precioUnit: i.precio })),
        total: carrito.reduce((a, i) => a + i.precio * i.cantidad, 0)
    });
    guardarTodo();
    carrito = [];
    renderizarCarrito();
    document.getElementById("clienteNombre").value = "";
    document.getElementById("clienteTelefono").value = "";
    document.getElementById("clienteNotas").value = "";
    mostrarMsg(`Pedido de ${clienteNombre} confirmado.`, false);
}

function mostrarMsg(msg, err) {
    const el = document.getElementById("mensajePedido");
    el.textContent = msg;
    el.style.color = err ? "#C0392B" : "var(--green)";
    setTimeout(() => el.textContent = "", 3000);
}

/* ─── ADMIN: PRODUCTOS ─────────────────────────────────── */
function renderizarListaProductos() {
    const cont = document.getElementById("listaProductos");
    if (!cont) return;
    if (!productos.length) { cont.innerHTML = '<div class="list-row">Sin productos registrados.</div>'; return; }
    cont.innerHTML = productos.map(p => `
      <div class="list-row">
        <div><strong>${p.nombre}</strong> — ${p.desc || ''} — L. ${p.precio.toFixed(2)}</div>
        <button class="btn-danger" onclick="eliminarProducto(${p.id})">Eliminar</button>
      </div>`).join('');
}
window.eliminarProducto = (id) => {
    if (!confirm("¿Eliminar este producto? También se perderá su receta.")) return;
    productos = productos.filter(p => p.id !== id);
    delete recetas[id];
    guardarTodo(); renderizarListaProductos(); renderizarMenu(); cargarSelectoresRecetas();
};
function agregarProducto() {
    const nombre = document.getElementById("prodNombre").value.trim();
    const desc = document.getElementById("prodDesc").value.trim();
    const precio = parseFloat(document.getElementById("prodPrecio").value);
    if (!nombre || isNaN(precio)) return;
    const nid = nextIdProducto++;
    productos.push({ id: nid, nombre, desc, precio }); recetas[nid] = [];
    guardarTodo(); renderizarListaProductos(); renderizarMenu(); cargarSelectoresRecetas();
    ["prodNombre", "prodDesc", "prodPrecio"].forEach(id => document.getElementById(id).value = "");
}

/* ─── ADMIN: INGREDIENTES ──────────────────────────────── */
function renderizarListaIngredientes() {
    const cont = document.getElementById("listaIngredientes");
    if (!cont) return;
    if (!ingredientes.length) { cont.innerHTML = '<div class="list-row">Sin ingredientes.</div>'; return; }
    cont.innerHTML = ingredientes.map(i => `
      <div class="list-row">
        <div><strong>${i.nombre}</strong> (${i.unidad})</div>
        <button class="btn-danger" onclick="eliminarIngrediente(${i.id})">Eliminar</button>
      </div>`).join('');
}
window.eliminarIngrediente = (id) => {
    if (!confirm("¿Eliminar ingrediente? Esto afectará las recetas que lo usan.")) return;
    ingredientes = ingredientes.filter(i => i.id !== id);
    for (let pid in recetas) recetas[pid] = recetas[pid].filter(r => r.idIngrediente !== id);
    guardarTodo(); renderizarListaIngredientes(); cargarSelectoresRecetas();
};
function agregarIngrediente() {
    const nombre = document.getElementById("ingNombre").value.trim();
    const unidad = document.getElementById("ingUnidad").value.trim() || "g";
    if (!nombre) return;
    ingredientes.push({ id: nextIdIngrediente++, nombre, unidad });
    guardarTodo(); renderizarListaIngredientes(); cargarSelectoresRecetas();
    document.getElementById("ingNombre").value = "";
    document.getElementById("ingUnidad").value = "g";
}

/* ─── ADMIN: RECETAS ───────────────────────────────────── */
function cargarSelectoresRecetas() {
    const sp = document.getElementById("selProductoReceta");
    const si = document.getElementById("selIngredienteReceta");
    if (sp) sp.innerHTML = productos.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
    if (si) si.innerHTML = ingredientes.map(i => `<option value="${i.id}">${i.nombre} (${i.unidad})</option>`).join('');
    renderizarRecetasPorProducto();
}
function renderizarRecetasPorProducto() {
    const cont = document.getElementById("recetasPorProducto");
    if (!cont) return;
    if (!productos.length) { cont.innerHTML = "<p>No hay productos.</p>"; return; }
    cont.innerHTML = productos.map(prod => {
        const rec = recetas[prod.id] || [];
        const items = rec.length
            ? rec.map(r => {
                const ing = ingredientes.find(i => i.id === r.idIngrediente);
                return `<li>${ing ? ing.nombre : "?"}: <strong>${r.cantidad} ${ing ? ing.unidad : ""}</strong>
              <button class="btn-danger" style="margin-left:auto; padding:.2rem .5rem; font-size:.72rem;" 
              onclick="eliminarIngDeReceta(${prod.id},${r.idIngrediente})">✕</button></li>`;
            }).join('')
            : '<li style="color:var(--text-3)">Sin ingredientes asignados</li>';
        return `<div class="recipe-card"><h4>${prod.nombre}</h4><ul>${items}</ul></div>`;
    }).join('');
}
window.eliminarIngDeReceta = (pid, iid) => {
    recetas[pid] = (recetas[pid] || []).filter(r => r.idIngrediente !== iid);
    guardarTodo(); renderizarRecetasPorProducto();
};
function agregarIngredienteAProducto() {
    const pid = parseInt(document.getElementById("selProductoReceta").value);
    const iid = parseInt(document.getElementById("selIngredienteReceta").value);
    const qty = parseFloat(document.getElementById("recetaCantidad").value);
    if (isNaN(qty) || qty <= 0) return;
    if (!recetas[pid]) recetas[pid] = [];
    const ex = recetas[pid].find(r => r.idIngrediente === iid);
    if (ex) ex.cantidad = qty; else recetas[pid].push({ idIngrediente: iid, cantidad: qty });
    guardarTodo(); renderizarRecetasPorProducto();
    document.getElementById("recetaCantidad").value = "";
}

/* ─── ADMIN: PRODUCCIÓN ────────────────────────────────── */
function renderizarAdminProduccion() {
    const cont = document.getElementById("necesidadesProduccion");
    if (!cont) return;
    const nec = {};
    pedidosConfirmados.forEach(ped => {
        if (ped.estado !== 'pendiente') return; // Solo calcular para pedidos pendientes (en curso)
        ped.items.forEach(item => {
            (recetas[item.productoId] || []).forEach(r => {
                nec[r.idIngrediente] = (nec[r.idIngrediente] || 0) + r.cantidad * item.cantidad;
            });
        });
    });
    if (!Object.keys(nec).length) {
        cont.innerHTML = '<div class="list-card"><div class="list-row" style="color:var(--text-3)">Sin pedidos en curso o sin recetas definidas.</div></div>';
        return;
    }
    const rows = Object.entries(nec).map(([id, qty]) => {
        const ing = ingredientes.find(i => i.id == id);
        return `<div class="production-row">
        <span class="prod-name">${ing ? ing.nombre : "Ingrediente desconocido"}</span>
        <span class="prod-qty">${qty.toFixed(2)} ${ing ? ing.unidad : ""}</span>
      </div>`;
    }).join('');
    cont.innerHTML = `<div class="production-list">${rows}</div>
      <p class="production-note">Producción basada en pedidos en curso. Cero desperdicios.</p>`;
}

/* ─── ADMIN: PEDIDOS (NUEVO) ───────────────────────────── */
let filtroPedidoActivo = 'pendiente';
let toastTimeout;

function renderizarAdminPedidos() {
    // 1. Calcular métricas
    const activos = pedidosConfirmados.filter(p => p.estado === 'pendiente').length;
    const recaudar = pedidosConfirmados
        .filter(p => p.estado === 'pendiente')
        .reduce((sum, p) => sum + p.total, 0);
    const completados = pedidosConfirmados.filter(p => p.estado === 'completado').length;

    const mActivos = document.getElementById("metricActivos");
    const mRecaudar = document.getElementById("metricRecaudar");
    const mCompletados = document.getElementById("metricCompletados");

    if (mActivos) mActivos.textContent = activos;
    if (mRecaudar) mRecaudar.textContent = `L. ${recaudar.toFixed(2)}`;
    if (mCompletados) mCompletados.textContent = completados;

    // 2. Filtrar y renderizar lista
    filtrarPedidos();
}
window.renderizarAdminPedidos = renderizarAdminPedidos;

function filtrarPedidos() {
    const cont = document.getElementById("listaPedidosAdmin");
    if (!cont) return;

    const searchVal = (document.getElementById("orderSearchInput")?.value || "").toLowerCase().trim();
    const dateVal = document.getElementById("orderDateFilter")?.value || "";

    let filtrados = pedidosConfirmados;

    // Filtrar por pestaña/estado activo
    if (filtroPedidoActivo !== 'todos') {
        filtrados = filtrados.filter(p => p.estado === filtroPedidoActivo);
    }

    // Filtrar por buscador
    if (searchVal) {
        filtrados = filtrados.filter(p =>
            p.cliente.nombre.toLowerCase().includes(searchVal) ||
            p.cliente.telefono.includes(searchVal)
        );
    }

    // Filtrar por fecha de recogida
    if (dateVal) {
        filtrados = filtrados.filter(p => p.fecha === dateVal);
    }

    // Ordenar: en curso por fecha de recogida (más antiguos primero), completados/cancelados por más nuevos
    filtrados.sort((a, b) => {
        if (a.estado === 'pendiente' && b.estado === 'pendiente') {
            return new Date(a.fecha) - new Date(b.fecha);
        }
        return new Date(b.fechaCreacion || 0) - new Date(a.fechaCreacion || 0);
    });

    if (!filtrados.length) {
        cont.innerHTML = `<div class="cart-empty" style="padding: 3rem 0;">No se encontraron pedidos con este filtro.</div>`;
        return;
    }

    cont.innerHTML = filtrados.map(p => {
        const itemsSummary = p.items.map(i => `${i.cantidad}x ${i.nombre}`).join(', ');
        const statusLabel = p.estado === 'pendiente' ? 'En curso' : p.estado === 'completado' ? 'Completado' : 'Cancelado';

        let actionButtons = '';
        if (p.estado === 'pendiente') {
            actionButtons = `
                        <button class="btn-action-text complete" onclick="cambiarEstadoPedido('${p.id}', 'completado')" title="Marcar como completado">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                            Completar
                        </button>
                        <button class="btn-action-text cancel" onclick="cambiarEstadoPedido('${p.id}', 'cancelado')" title="Cancelar pedido">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-right:4px;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            Cancelar
                        </button>
                    `;
        } else {
            actionButtons = `
                        <button class="btn-action-text restore" onclick="cambiarEstadoPedido('${p.id}', 'pendiente')" title="Restablecer a Pendiente">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-right:4px;"><path d="M2.5 2v6h6M21.5 22v-6h-6"></path><path d="M22 11.5A10 10 0 0 0 3.2 7.2L2.5 8M2 12.5a10 10 0 0 0 18.8 4.3l.7-.8"></path></svg>
                            Restablecer
                        </button>
                    `;
        }

        // Generar link de WhatsApp
        const formattedDate = formatearFecha(p.fecha);
        const messageText = encodeURIComponent(
            `¡Hola ${p.cliente.nombre}! Te escribimos de Bendito Café en relación a tu pedido para el día ${formattedDate}.\n\n` +
            `Detalle de tu pedido:\n` +
            p.items.map(i => `- ${i.cantidad}x ${i.nombre} (L. ${(i.precioUnit * i.cantidad).toFixed(2)})`).join('\n') +
            `\nTotal: L. ${p.total.toFixed(2)}\n\n` +
            (p.cliente.notas ? `Nota: "${p.cliente.notas}"\n\n` : '') +
            `Tu pedido está actualmente: ${p.estado === 'pendiente' ? '¡En preparación!' : p.estado === 'completado' ? '¡Listo para retirar!' : 'Cancelado'}.\n` +
            `¡Muchas gracias por tu preferencia!`
        );
        const cleanPhone = p.cliente.telefono.replace(/[^0-9]/g, '');
        const fullPhone = cleanPhone.length === 8 ? `504${cleanPhone}` : cleanPhone;
        const whatsappUrl = `https://wa.me/${fullPhone}?text=${messageText}`;

        return `
                    <div class="order-card" id="card-${p.id}">
                        <div class="order-header">
                            <div class="order-client-info">
                                <span class="order-client-name">${p.cliente.nombre}</span>
                                <div class="order-meta-info">
                                    <div class="meta-item">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                                        Entrega: <strong>${formattedDate}</strong>
                                    </div>
                                    <span class="meta-dot" style="color:var(--text-3); margin-left: 4px; margin-right: 4px;">·</span>
                                    <div class="meta-item">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                                        ${p.cliente.telefono}
                                    </div>
                                </div>
                            </div>
                            <span class="order-status-badge ${p.estado}">${statusLabel}</span>
                        </div>
                        <div class="order-body">
                            <div class="order-items-summary">${itemsSummary}</div>
                            <div class="order-total-row">
                                <span style="color: var(--text-2); font-size: .8rem;">Total:</span>
                                <span class="order-total-price">L. ${p.total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div class="order-footer-actions">
                            <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-action-icon whatsapp" title="Contactar por WhatsApp">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle;"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
                            </a>
                            <button class="btn-action-icon" onclick="abrirDetallePedido('${p.id}')" title="Ver información completa">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                            </button>
                            ${actionButtons}
                        </div>
                    </div>
                `;
    }).join('');
}
window.filtrarPedidos = filtrarPedidos;

function cambiarFiltroPedido(filtro) {
    filtroPedidoActivo = filtro;
    document.querySelectorAll("#tabPedidos .filter-chip").forEach(chip => {
        if (chip.dataset.filter === filtro) {
            chip.classList.add("active");
        } else {
            chip.classList.remove("active");
        }
    });
    filtrarPedidos();
}
window.cambiarFiltroPedido = cambiarFiltroPedido;

function cambiarEstadoPedido(id, nuevoEstado) {
    const ped = pedidosConfirmados.find(p => p.id == id);
    if (!ped) return;

    const estadoAnterior = ped.estado;
    ped.estado = nuevoEstado;
    guardarTodo();

    renderizarAdminPedidos();
    renderizarAdminProduccion();

    const estadoTexto = nuevoEstado === 'completado' ? 'completado' : nuevoEstado === 'cancelado' ? 'cancelado' : 'restablecido';
    const alertMsg = `Pedido de ${ped.cliente.nombre} marcado como ${estadoTexto}.`;
    mostrarMsgAdmin(alertMsg, false, () => {
        ped.estado = estadoAnterior;
        guardarTodo();
        renderizarAdminPedidos();
        renderizarAdminProduccion();
        mostrarMsgAdmin("Cambio deshecho.", false);
    });
}
window.cambiarEstadoPedido = cambiarEstadoPedido;

function abrirDetallePedido(id) {
    const ped = pedidosConfirmados.find(p => p.id == id);
    if (!ped) return;

    const modal = document.getElementById("orderDetailModal");
    const content = document.getElementById("orderDetailContent");
    if (!modal || !content) return;

    const formattedDate = formatearFecha(ped.fecha);
    const statusLabel = ped.estado === 'pendiente' ? 'En curso' : ped.estado === 'completado' ? 'Completado' : 'Cancelado';

    let itemsHtml = ped.items.map(item => `
                <div class="detail-item-row">
                    <div>
                        <span class="detail-item-name">${item.nombre}</span>
                        <span class="detail-item-qty">x${item.cantidad}</span>
                    </div>
                    <span class="detail-item-subtotal">L. ${(item.precioUnit * item.cantidad).toFixed(2)}</span>
                </div>
            `).join('');

    const notasHtml = ped.cliente.notas
        ? `<div class="detail-info-label" style="margin-top: .75rem; font-size: .8rem; text-align: left;">Notas del Cliente:</div>
                   <div class="detail-notes-box">${ped.cliente.notas}</div>`
        : '';

    content.innerHTML = `
                <div class="detail-client-section">
                    <div class="detail-info-row">
                        <span class="detail-info-label">Cliente</span>
                        <span class="detail-info-value">${ped.cliente.nombre}</span>
                    </div>
                    <div class="detail-info-row">
                        <span class="detail-info-label">Teléfono</span>
                        <span class="detail-info-value">${ped.cliente.telefono}</span>
                    </div>
                    <div class="detail-info-row">
                        <span class="detail-info-label">Fecha de recogida</span>
                        <span class="detail-info-value" style="color: var(--accent);">${formattedDate}</span>
                    </div>
                    <div class="detail-info-row">
                        <span class="detail-info-label">Estado</span>
                        <span class="order-status-badge ${ped.estado}" style="display: inline-block;">${statusLabel}</span>
                    </div>
                    ${notasHtml}
                </div>

                <div class="detail-title" style="font-size: 1.1rem; margin-bottom: .75rem; text-align: left;">Productos Pedidos</div>
                <div class="detail-items-list">
                    ${itemsHtml}
                    <div class="cart-divider" style="margin: .5rem 0;"></div>
                    <div class="detail-item-row" style="font-size: 1rem; font-weight: 700;">
                        <span>Total</span>
                        <span style="color: var(--accent); font-size: 1.15rem;">L. ${ped.total.toFixed(2)}</span>
                    </div>
                </div>

                <div style="display: flex; gap: .75rem; justify-content: flex-end; margin-top: 1.5rem;">
                    <button class="btn-secondary" onclick="cerrarDetallePedido()">Cerrar</button>
                    ${ped.estado === 'pendiente'
            ? `<button class="btn-primary" style="background: var(--green);" onclick="cambiarEstadoPedido('${ped.id}', 'completado'); cerrarDetallePedido();">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline; vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                             Completar Pedido
                           </button>`
            : ''
        }
                </div>
            `;

    modal.classList.add("open");
}
window.abrirDetallePedido = abrirDetallePedido;

function cerrarDetallePedido() {
    const modal = document.getElementById("orderDetailModal");
    if (modal) modal.classList.remove("open");
}
window.cerrarDetallePedido = cerrarDetallePedido;

function formatearFecha(fechaStr) {
    if (!fechaStr) return '';
    const partes = fechaStr.split('-');
    if (partes.length === 3) {
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return `${partes[2]} de ${meses[parseInt(partes[1], 10) - 1]} del ${partes[0]}`;
    }
    return fechaStr;
}

function mostrarMsgAdmin(msg, err, undoCallback) {
    const toast = document.getElementById("adminToast");
    const text = document.getElementById("adminToastText");
    const undoBtn = document.getElementById("adminToastUndoBtn");
    if (!toast) return;

    clearTimeout(toastTimeout);

    text.textContent = msg;
    toast.style.borderLeft = err ? "4px solid #C0392B" : "4px solid var(--green)";

    if (undoCallback) {
        undoBtn.style.display = "block";
        const newUndoBtn = undoBtn.cloneNode(true);
        undoBtn.parentNode.replaceChild(newUndoBtn, undoBtn);
        newUndoBtn.addEventListener("click", () => {
            undoCallback();
            toast.classList.remove("show");
        });
    } else {
        undoBtn.style.display = "none";
    }

    toast.classList.add("show");

    toastTimeout = setTimeout(() => {
        toast.classList.remove("show");
    }, 5000);
}
window.mostrarMsgAdmin = mostrarMsgAdmin;

/* ─── TABS ─────────────────────────────────────────────── */
function initTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const tab = btn.dataset.tab;
            document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
            document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");
            document.getElementById(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}`).classList.add("active");
            if (tab === "pedidos") renderizarAdminPedidos();
            if (tab === "produccion") renderizarAdminProduccion();
            if (tab === "recetas") cargarSelectoresRecetas();
            if (tab === "productos") renderizarListaProductos();
            if (tab === "ingredientes") renderizarListaIngredientes();
        });
    });
}

/* ─── INIT ─────────────────────────────────────────────── */
function setupOrderFilters() {
    // Setup filter chips
    document.querySelectorAll("#tabPedidos .filter-chip").forEach(chip => {
        const handler = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const filter = chip.dataset.filter;
            cambiarFiltroPedido(filter);
        };

        // Remover listeners previos para evitar duplicados
        chip.removeEventListener("click", handler);
        chip.removeEventListener("touchend", handler);

        chip.addEventListener("click", handler);
        chip.addEventListener("touchend", handler, { passive: false });
    });

    // Setup search input
    const searchInput = document.getElementById("orderSearchInput");
    if (searchInput) {
        const triggerFilter = (e) => {
            filtrarPedidos();
        };
        searchInput.removeEventListener("input", triggerFilter);
        searchInput.removeEventListener("keyup", triggerFilter);
        searchInput.removeEventListener("change", triggerFilter);

        searchInput.addEventListener("input", triggerFilter);
        searchInput.addEventListener("keyup", triggerFilter);
        searchInput.addEventListener("change", triggerFilter);
    }

    // Setup date filter
    const dateFilter = document.getElementById("orderDateFilter");
    if (dateFilter) {
        const triggerDate = () => {
            filtrarPedidos();
        };
        dateFilter.removeEventListener("change", triggerDate);
        dateFilter.addEventListener("change", triggerDate);
    }
}
window.setupOrderFilters = setupOrderFilters;

function abrirAdminModal() {
    // Abrir primero para que, aunque falle un render en algún dispositivo, el modal al menos aparezca.
    document.body.classList.add("modal-open");
    const adminModal = document.getElementById("adminModal");
    if (adminModal) adminModal.classList.add("open");

    try {
        // Asegurar que la pestaña "Pedidos" esté activa por defecto al abrir
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
        const tabBtn = document.querySelector('.tab-btn[data-tab="pedidos"]');
        if (tabBtn) tabBtn.classList.add("active");
        const tabPane = document.getElementById("tabPedidos");
        if (tabPane) tabPane.classList.add("active");

        renderizarAdminPedidos();
        renderizarListaProductos(); renderizarListaIngredientes();
        cargarSelectoresRecetas(); renderizarAdminProduccion();
    } catch (err) {
        console.error("Error al abrir el panel de administración:", err);
    }
}
window.abrirAdminModal = abrirAdminModal;

function cerrarAdminModal() {
    document.body.classList.remove("modal-open");
    const adminModal = document.getElementById("adminModal");
    if (adminModal) adminModal.classList.remove("open");
}
window.cerrarAdminModal = cerrarAdminModal;

function setupAdminModalHandlers() {
    const toggleBtn = document.getElementById("adminToggleBtn");
    const closeBtn = document.getElementById("closeAdminBtn");
    const adminModal = document.getElementById("adminModal");
    if (!toggleBtn || !closeBtn || !adminModal) return;

    // Evitar doble binding si esta función se llama más de una vez.
    if (toggleBtn.dataset.bound === "1") return;
    toggleBtn.dataset.bound = "1";

    const open = (e) => {
        // En algunos Android puede dispararse touch + click; bloqueamos duplicados.
        if (e) {
            e.preventDefault?.();
            e.stopPropagation?.();
        }
        if (toggleBtn.dataset.opening === "1") return;
        toggleBtn.dataset.opening = "1";
        requestAnimationFrame(() => { toggleBtn.dataset.opening = "0"; });
        abrirAdminModal();
    };

    // Fallback robusto para móviles: pointer/touch además de click.
    toggleBtn.addEventListener("pointerup", open);
    toggleBtn.addEventListener("touchend", open, { passive: false });
    toggleBtn.addEventListener("click", open);

    closeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        cerrarAdminModal();
    });

    // Usar mousedown y mouseup para evitar cierres accidentales por reajustes de layout (como el teclado móvil)
    let clickTargetIsOverlay = false;
    adminModal.addEventListener("mousedown", e => {
        clickTargetIsOverlay = (e.target === adminModal);
    });
    adminModal.addEventListener("mouseup", e => {
        if (clickTargetIsOverlay && e.target === adminModal) {
            cerrarAdminModal();
        }
    });
    // Soporte robusto de gestos en móviles
    let touchTargetIsOverlay = false;
    adminModal.addEventListener("touchstart", e => {
        touchTargetIsOverlay = (e.target === adminModal);
    }, { passive: true });
    adminModal.addEventListener("touchend", e => {
        if (touchTargetIsOverlay && e.target === adminModal) {
            e.preventDefault();
            cerrarAdminModal();
        }
    }, { passive: false });
}

document.addEventListener("DOMContentLoaded", () => {
    setupAdminModalHandlers();
    setupOrderFilters();
    cargarDatos();
    renderizarMenu();
    renderizarCarrito();

    // Set today's date dynamically
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById("fechaRecogida");
    if (dateInput) {
        dateInput.min = today;
        dateInput.value = today;
    }

    document.getElementById("realizarPedidoBtn").addEventListener("click", realizarPedido);
    document.addEventListener("keydown", e => {
        if (e.key === "Escape") {
            cerrarAdminModal();
            cerrarDetallePedido();
        }
    });
    document.getElementById("btnAddProducto").addEventListener("click", agregarProducto);
    document.getElementById("btnAddIngrediente").addEventListener("click", agregarIngrediente);
    document.getElementById("btnAgregarIngredienteAProducto").addEventListener("click", agregarIngredienteAProducto);
    document.getElementById("resetPedidosBtn").addEventListener("click", () => {
        if (!confirm("¿Reiniciar todos los pedidos? Esto borrará el historial por completo.")) return;
        pedidosConfirmados = []; guardarTodo(); renderizarAdminProduccion(); renderizarAdminPedidos();
        mostrarMsgAdmin("Pedidos reiniciados.", false);
    });
    initTabs();
});

// Si por alguna razón DOMContentLoaded ya ocurrió (p.ej. BFCache), intentamos enlazar igual.
setupAdminModalHandlers();
setupOrderFilters();