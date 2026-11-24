#!/usr/bin/env python3
"""
Genera las 11 páginas legales independientes de KRONO Game Store bajo la normativa colombiana
(Ley 1480 de 2011, Ley 2439 de 2024, Ley 1581 de 2012 y Ley 527 de 1999) como borradores
sujetos a validación jurídica previa al inicio de ventas comerciales.
"""

import os

ROOT = os.path.join(os.path.dirname(__file__), '..')
LEGAL_DIR = os.path.join(ROOT, 'legal')
os.makedirs(LEGAL_DIR, exist_ok=True)

DRAFT_BANNER = """
<div class="legal-draft-alert" role="note">
  <strong>BORRADOR SUJETO A VALIDACIÓN JURÍDICA:</strong> Este documento es un borrador técnico-legal
  elaborado para operar en la República de Colombia y <strong>debe ser revisado y aprobado por un abogado
  colombiano</strong> antes de habilitar ventas reales. Los datos del comerciante marcados entre corchetes
  son pendientes de diligenciamiento real; KRONO no inventa razón social ni NIT.
</div>
"""

SELLER_ID_BLOCK = """
<section class="legal-card">
  <h2>Identificación del comerciante (Operación digital en Colombia)</h2>
  <ul>
    <li><strong>Nombre comercial:</strong> KRONO Game Store</li>
    <li><strong>Razón social / Nombre legal:</strong> [PENDIENTE — RAZÓN SOCIAL O PERSONA NATURAL REGISTRADA]</li>
    <li><strong>NIT / Documento tributario:</strong> [PENDIENTE — NIT VERIFICABLE EN RUT]</li>
    <li><strong>Modalidad operativa:</strong> Comercio electrónico 100% en línea para Colombia (sin establecimiento físico abierto al público).</li>
    <li><strong>Correo de notificaciones judiciales y PQRS:</strong> [PENDIENTE — CORREO OFICIAL DEL COMERCIANTE]</li>
    <li><strong>Teléfono de atención Colombia:</strong> [PENDIENTE — LÍNEA +57 OFICIAL]</li>
    <li><strong>Autoridad de protección al consumidor:</strong>
      <a href="https://www.sic.gov.co/" target="_blank" rel="noopener noreferrer">Superintendencia de Industria y Comercio (SIC) ↗</a>
    </li>
  </ul>
</section>
"""

PAGES = [
    (
        'terminos-y-condiciones.html',
        'Términos y Condiciones',
        'Condiciones generales de acceso, navegación y comercio electrónico de KRONO Game Store en Colombia.',
        """
        <h2>1. Objeto y ámbito territorial</h2>
        <p>Los presentes Términos y Condiciones regulan el acceso y uso del portal <strong>KRONO Game Store</strong> y las futuras relaciones de consumo que se perfeccionen dentro del territorio de la República de Colombia conforme a la <strong>Ley 1480 de 2011</strong> (Estatuto del Consumidor), la <strong>Ley 2439 de 2024</strong> y la <strong>Ley 527 de 1999</strong>.</p>
        <h2>2. Naturaleza del catálogo y transparencia comercial</h2>
        <p>KRONO presenta información estructurada de videojuegos físicos y digitales con sus fuentes verificadas. Ningún título se ofrecerá para compra efectiva sin contar previamente con inventario disponible o convenio con distribuidor autorizado. KRONO no se presenta como distribuidor oficial de fabricantes o editores salvo que medie autorización escrita.</p>
        <h2>3. Registro obligatorio para compras</h2>
        <p>Para iniciar un proceso de compra es obligatorio contar con una cuenta registrada y verificada por el cliente. El usuario se compromete a suministrar información veraz y a custodiar sus credenciales de acceso.</p>
        <h2>4. Precios, moneda e impuestos</h2>
        <p>El precio total a pagar se informa de manera previa, clara y visible en pesos colombianos (COP) antes de confirmar el pedido, discriminando subtotal, descuentos válidos, impuestos aplicables y costo de envío cuando corresponda. La visualización alternativa en USD utiliza una tasa verificable cuya fuente y fecha se informan en pantalla.</p>
        <h2>5. Derechos irrenunciables del consumidor</h2>
        <p>Ninguna cláusula de estos Términos podrá interpretarse como renuncia o limitación de los derechos reconocidos al consumidor por la legislación colombiana vigente, incluidos la garantía legal, el derecho de retracto cuando proceda y la reversión del pago.</p>
        """
    ),
    (
        'politica-de-privacidad.html',
        'Política de Privacidad',
        'Lineamientos de privacidad y confidencialidad de la información personal en KRONO Game Store.',
        """
        <h2>1. Compromiso de privacidad</h2>
        <p>KRONO protege la privacidad de sus visitantes y clientes bajo los principios de legalidad, finalidad, libertad, veracidad, transparencia, seguridad y confidencialidad establecidos en la <strong>Ley 1581 de 2012</strong>.</p>
        <h2>2. Información que recopilamos</h2>
        <p>Dependiendo de los servicios utilizados, podemos recopilar datos de identificación (nombre, documento de identidad para facturación y pagos en Colombia), datos de contacto (correo electrónico, teléfono celular +57, departamento y ciudad para envíos), preferencias de catálogo e historial de pedidos.</p>
        <h2>3. Seguridad financiera</h2>
        <p>KRONO <strong>nunca almacena números completos de tarjetas de crédito o débito ni códigos CVV</strong>. Los pagos electrónicos son procesados directamente por pasarelas certificadas PCI-DSS que operan legalmente en Colombia.</p>
        <h2>4. Conservación y medidas de seguridad</h2>
        <p>Los datos se resguardan mediante cifrado en tránsito (HTTPS/TLS), control de acceso basado en roles y políticas de seguridad a nivel de fila (Row Level Security) en base de datos.</p>
        """
    ),
    (
        'tratamiento-de-datos.html',
        'Política de Tratamiento de Datos Personales',
        'Política formal de Habeas Data conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013.',
        """
        <h2>1. Marco normativo (Habeas Data)</h2>
        <p>Esta política da cumplimiento al artículo 15 de la Constitución Política de Colombia, la <strong>Ley Estatutaria 1581 de 2012</strong> y el <strong>Decreto 1377 de 2013</strong> (compilado en el Decreto 1074 de 2015).</p>
        <h2>2. Finalidades del tratamiento</h2>
        <ul>
          <li>Gestionar el registro de cuenta, autenticación segura y atención de PQRS.</li>
          <li>Procesar pedidos, validaciones antifraude, facturación electrónica y entregas en Colombia.</li>
          <li>Personalizar recomendaciones del catálogo únicamente según preferencias del usuario.</li>
          <li>Enviar comunicaciones promocionales únicamente cuando medie autorización previa, expresa e informada.</li>
        </ul>
        <h2>3. Derechos del titular</h2>
        <p>El titular puede en cualquier momento conocer, actualizar, rectificar y suprimir sus datos personales, así como revocar la autorización otorgada o presentar quejas ante la <a href="https://www.sic.gov.co/" target="_blank" rel="noopener noreferrer">Superintendencia de Industria y Comercio (SIC)</a>.</p>
        <h2>4. Procedimiento para consultas y reclamos</h2>
        <p>Las consultas serán atendidas en un término máximo de diez (10) días hábiles y los reclamos en un término máximo de quince (15) días hábiles contados a partir del día siguiente a su recibo, conforme a los artículos 14 y 15 de la Ley 1581 de 2012.</p>
        """
    ),
    (
        'politica-de-cookies.html',
        'Política de Cookies y Almacenamiento Local',
        'Uso transparente de cookies técnicas y almacenamiento local en KRONO Game Store.',
        """
        <h2>1. Qué tecnologías utilizamos</h2>
        <p>KRONO utiliza cookies técnicas y almacenamiento local del navegador (<code>localStorage</code>) estrictamente necesarios para recordar la moneda seleccionada (COP/USD), el tema visual, el historial reciente de búsquedas, la sesión autenticada y el carrito de compras.</p>
        <h2>2. Cookies de terceros</h2>
        <p>Al reproducir un tráiler incrustado bajo demanda, YouTube (<code>youtube-nocookie.com</code>) puede establecer cookies técnicas propias. Las pasarelas de pago emplean cookies de prevención de fraude al redirigir al checkout seguro.</p>
        <h2>3. Gestión por el usuario</h2>
        <p>Puedes deshabilitar o borrar cookies y almacenamiento local en cualquier momento desde la configuración de tu navegador.</p>
        """
    ),
    (
        'cambios-y-devoluciones.html',
        'Política de Cambios y Devoluciones',
        'Condiciones claras de cambios y devoluciones para productos físicos y digitales en Colombia.',
        """
        <h2>1. Videojuegos físicos</h2>
        <p>Para cambios voluntarios de videojuegos físicos en Colombia, el producto debe conservar su empaque original sellado, sin señales de uso ni alteración de sellos de seguridad. Esto no limita en ningún caso la garantía legal por producto defectuoso ni el derecho de retracto.</p>
        <h2>2. Errores en el despacho o producto defectuoso</h2>
        <p>Si recibes un título diferente al comprado, dañado durante el transporte o con defecto de fábrica, KRONO asumirá los costos de recolección y reposición o devolución íntegra del dinero conforme a la Ley 1480 de 2011.</p>
        <h2>3. Plazo de devolución del dinero</h2>
        <p>En caso de proceder la devolución del dinero, el reembolso se efectuará dentro de los plazos legales establecidos por la Ley 1480 de 2011 y la Ley 2439 de 2024 (sin exceder 15 días calendario en los supuestos actualizados por la normativa vigente).</p>
        """
    ),
    (
        'derecho-de-retracto.html',
        'Derecho de Retracto y Excepciones Legales',
        'Información detallada sobre el artículo 47 de la Ley 1480 de 2011 y la Ley 2439 de 2024 para compras a distancia en Colombia.',
        """
        <h2>1. Regla general (Art. 47 Ley 1480 de 2011 y Ley 2439 de 2024)</h2>
        <p>En las ventas realizadas mediante métodos no tradicionales o a distancia (comercio electrónico), el consumidor tiene derecho a ejercer el <strong>derecho de retracto</strong> dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la entrega del bien o a la celebración del contrato de prestación de servicios, según corresponda.</p>
        <h2>2. Aplicación a videojuegos físicos</h2>
        <p>El consumidor podrá devolver el videojuego físico en las mismas condiciones en que lo recibió. Conforme al numeral 1 del artículo 47 de la Ley 1480 de 2011 y la naturaleza de bienes susceptibles de copia inmediata, la excepción de retracto debe analizarse caso a caso cuando el consumidor ha roto el sello original de un soporte físico de software o medio óptico.</p>
        <h2>3. Análisis responsable sobre productos y claves digitales</h2>
        <p><strong>KRONO no afirma que todos los productos digitales estén automáticamente excluidos del derecho de retracto.</strong> La procedencia del retracto en contenidos digitales depende de las condiciones concretas de suministro:</p>
        <ul>
          <li><strong>Antes de la revelación o entrega del código / descarga:</strong> el consumidor conserva plenamente su derecho a desistir o retractarse del pedido.</li>
          <li><strong>Una vez revelada, descargada o redimida una clave digital única de un solo uso</strong> con consentimiento previo e informado del consumidor sobre la ejecución inmediata del suministro, se analizarán las excepciones legales aplicables (bienes de consumo inmediato o susceptibles de copia no reversible), garantizando siempre la atención formal del reclamo y los derechos frente a códigos inválidos o defectuosos.</li>
        </ul>
        <h2>4. Reembolso sin retenciones injustificadas</h2>
        <p>Cuando proceda el retracto, el dinero será devuelto íntegramente sin descuentos ni retenciones no autorizadas por la ley, dentro del plazo legal vigente.</p>
        """
    ),
    (
        'garantias.html',
        'Política de Garantías',
        'Garantía legal de idoneidad, calidad y funcionamiento de videojuegos físicos y digitales.',
        """
        <h2>1. Garantía legal (Ley 1480 de 2011)</h2>
        <p>Todos los videojuegos comercializados por KRONO cuentan con la garantía legal de calidad, idoneidad y buen funcionamiento establecida en los artículos 7 y siguientes de la Ley 1480 de 2011.</p>
        <h2>2. Cobertura en ediciones físicas</h2>
        <p>Cubre defectos de fabricación del disco, cartucho o empaque sellado reportados dentro del término de garantía anunciado en la ficha del producto.</p>
        <h2>3. Cobertura en licencias y claves digitales</h2>
        <p>KRONO garantiza que toda clave digital entregada proviene únicamente de distribuidores autorizados, corresponde a la región y plataforma indicadas en la ficha y es válida para su activación oficial. Si un código resulta defectuoso o no corresponde al producto adquirido, se gestionará su reposición verificada o reembolso total.</p>
        """
    ),
    (
        'politica-de-entrega.html',
        'Política de Entrega y Cobertura en Colombia',
        'Condiciones de entrega digital y envíos nacionales exclusivamente en Colombia.',
        """
        <h2>1. Cobertura geográfica actual</h2>
        <p>Por ahora, KRONO opera comercialmente <strong>únicamente dentro de la República de Colombia</strong>. La tienda opera 100% en línea y no cuenta con punto de venta físico abierto al público.</p>
        <h2>2. Entregas digitales</h2>
        <p>Las claves o accesos digitales se liberan en el espacio <em>Mi Krono</em> únicamente después de recibir confirmación criptográfica verificable de pago aprobado por parte de la pasarela de pagos.</p>
        <h2>3. Envíos de videojuegos físicos</h2>
        <p>Los envíos físicos se despachan a través de transportadoras nacionales certificadas a departamentos y municipios con cobertura en Colombia. El costo de envío y el plazo estimado de entrega se informan con claridad antes de finalizar el pago. Si ocurre una demora superior a 30 días calendario, el consumidor podrá resolver el contrato y recibir el reembolso íntegro conforme a la ley.</p>
        """
    ),
    (
        'politica-de-pagos.html',
        'Política de Pagos y Reversión del Pago',
        'Medios de pago admitidos en Colombia (Visa, Mastercard, PayPal, Nequi, Corresponsales) y Art. 51 Ley 1480.',
        """
        <h2>1. Medios de pago habilitados para Colombia</h2>
        <ul>
          <li><strong>Tarjetas Visa y Mastercard</strong> (procesadas mediante pasarela segura Wompi Colombia).</li>
          <li><strong>Nequi</strong> (aprobación directa desde la app Nequi vía Wompi).</li>
          <li><strong>PayPal</strong> (procesamiento verificado en plataforma PayPal).</li>
          <li><strong>Pago en Corresponsales en Colombia</strong> (Efecty, Corresponsal Bancolombia y PuntoRed) mediante código de pago único con vigencia de 48 horas.</li>
        </ul>
        <h2>2. Confirmación segura de pagos</h2>
        <p>Ningún pedido se marca como pagado desde el navegador. La aprobación del pago ocurre exclusivamente cuando nuestro servidor recibe y verifica la firma digital (webhook) del proveedor de pagos.</p>
        <h2>3. Reversión del pago (Artículo 51 Ley 1480 de 2011 y Decreto 587 de 2016)</h2>
        <p>En compras efectuadas con medios de pago electrónicos (tarjetas, billeteras electrónicas), el consumidor podrá solicitar la <strong>reversión del pago</strong> dentro de los cinco (5) días hábiles siguientes a conocer la situación cuando sea objeto de fraude, corresponda a una operación no solicitada, el producto no sea recibido, no corresponda a lo solicitado o sea defectuoso.</p>
        """
    ),
    (
        'productos-digitales.html',
        'Política de Productos Digitales y Licencias',
        'Transparencia sobre origen de claves digitales, requisitos de plataforma y propiedad intelectual.',
        """
        <h2>1. Origen legítimo de licencias</h2>
        <p>KRONO se compromete a no comercializar claves obtenidas en mercados grises ni fuentes no autorizadas. Cada producto digital especificará claramente la plataforma de activación (Steam, PlayStation Store, Xbox, Nintendo eShop, Epic Games Store), región compatible (Colombia / LATAM / Global) y requisitos técnicos.</p>
        <h2>2. Propiedad intelectual y marcas de terceros</h2>
        <p>Todas las marcas comerciales, logotipos, portadas y materiales audiovisuales pertenecen a sus respectivos desarrolladores y editores. KRONO no afirma afiliación oficial ni distribución exclusiva salvo autorización expresa.</p>
        <h2>3. Disponibilidad en la biblioteca del cliente</h2>
        <p>Los productos digitales adquiridos aparecerán exclusivamente en el apartado <em>Mi Krono</em> del titular de la cuenta una vez el pago haya sido verificado y aprobado.</p>
        """
    ),
    (
        'contacto-y-reclamaciones.html',
        'Contacto, PQRS y Reclamaciones',
        'Canales oficiales de peticiones, quejas, reclamos y sugerencias (PQRS) y enlace directo a la SIC.',
        """
        <h2>1. Canales de atención al consumidor (100% en línea)</h2>
        <p>Puedes radicar peticiones, quejas, reclamos, solicitudes de garantía, retracto o reversión del pago a través del formulario de contacto en la <a href="../index.html#contacto">página principal de KRONO</a> o al correo oficial de notificaciones una vez habilitada la operación comercial.</p>
        <h2>2. Tiempos de respuesta</h2>
        <p>Toda PQRS recibirá un número de radicado y será respondida dentro de los quince (15) días hábiles siguientes a su recepción, conforme a la normativa colombiana de protección al consumidor.</p>
        <h2>3. Autoridad de protección al consumidor en Colombia</h2>
        <p>Si consideras vulnerados tus derechos como consumidor, puedes acudir ante la <strong>Superintendencia de Industria y Comercio (SIC)</strong>:</p>
        <ul>
          <li>Portal oficial: <a href="https://www.sic.gov.co/" target="_blank" rel="noopener noreferrer">https://www.sic.gov.co/ ↗</a></li>
          <li>Línea gratuita nacional Colombia: 01 8000 910 165 · Línea en Bogotá: (601) 592 0400</li>
        </ul>
        """
    )
]

LEGAL_CSS = """
.legal-shell { max-width: 860px; margin: 0 auto; padding: 36px 24px 72px; }
.legal-draft-alert { padding: 16px 18px; border-radius: 10px; border: 1px solid rgba(212,175,55,0.45); background: rgba(212,175,55,0.1); font-size: 13.5px; margin-bottom: 24px; line-height: 1.55; }
.legal-card { padding: 20px 22px; border-radius: 12px; background: var(--surface); border: 1px solid var(--border); margin: 22px 0; }
.legal-article h1 { font-size: clamp(1.7rem, 3vw, 2.3rem); margin: 8px 0 10px; letter-spacing: -0.03em; }
.legal-article h2 { font-size: 18px; margin: 26px 0 8px; color: var(--ink); }
.legal-article p, .legal-article li { font-size: 14.5px; line-height: 1.68; color: var(--ink-secondary); }
.legal-article ul { padding-left: 20px; }
.legal-article a { color: var(--accent); text-decoration: underline; text-underline-offset: 3px; }
.legal-nav-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 32px; padding-top: 22px; border-top: 1px solid var(--border); }
.legal-nav-grid a { font-size: 12.5px; padding: 6px 11px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface); color: var(--ink-secondary); text-decoration: none; }
.legal-nav-grid a:hover, .legal-nav-grid a.active { border-color: var(--accent); color: var(--ink); }
"""

with open(os.path.join(LEGAL_DIR, 'legal.css'), 'w', encoding='utf-8') as f:
    f.write(LEGAL_CSS.strip() + '\n')

nav_links = '\n'.join(
    f'<a href="{fname}">{title}</a>' for fname, title, _, _ in PAGES
)

for fname, title, desc, body in PAGES:
    html = f"""<!DOCTYPE html>
<html lang="es" data-theme="dark">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{title} — KRONO Game Store (Colombia)</title>
    <meta name="description" content="{desc}" />
    <link rel="icon" type="image/svg+xml" href="../assets/images/favicon.svg" />
    <link rel="stylesheet" href="../css/styles.css" />
    <link rel="stylesheet" href="../css/aurora-case.css" />
    <link rel="stylesheet" href="legal.css" />
  </head>
  <body>
    <header class="site-header">
      <div class="container header-inner">
        <a href="../index.html" class="brand" aria-label="Volver a KRONO">
          <img src="../assets/brand/krono-horizontal.svg" alt="KRONO" class="brand-logo-img" width="150" height="30" />
        </a>
        <div class="header-actions">
          <a href="../index.html#catalogo" class="btn btn-secondary btn-sm">← Volver a la tienda</a>
        </div>
      </div>
    </header>

    <main class="legal-shell legal-article">
      <p class="section-eyebrow">Marco Legal Colombia · Borrador v1.0 (2026-11-24)</p>
      <h1>{title}</h1>
      <p style="margin-bottom: 18px">{desc}</p>
      {DRAFT_BANNER}
      {SELLER_ID_BLOCK}
      <section>
        {body}
      </section>
      <nav class="legal-nav-grid" aria-label="Documentos legales de KRONO">
        {nav_links}
      </nav>
    </main>
  </body>
</html>
"""
    with open(os.path.join(LEGAL_DIR, fname), 'w', encoding='utf-8') as f:
        f.write(html)

# Actualizar sitemap.xml con las 11 páginas legales
urls = [
    'https://doritotes444.github.io/krono-games/',
    'https://doritotes444.github.io/krono-games/#catalogo',
    'https://doritotes444.github.io/krono-games/#noticias',
] + [f'https://doritotes444.github.io/krono-games/legal/{fname}' for fname, _, _, _ in PAGES]

sitemap = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for u in urls:
    sitemap.append(f'  <url><loc>{u}</loc><lastmod>2026-11-24</lastmod></url>')
sitemap.append('</urlset>')
with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8') as f:
    f.write('\n'.join(sitemap) + '\n')

print(f'Generadas {len(PAGES)} páginas legales en legal/ y actualizado sitemap.xml ({len(urls)} URLs).')
