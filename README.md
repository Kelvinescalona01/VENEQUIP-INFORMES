# Venequip - Sistema Integral de Informes Técnicos CAT

Sistema Web Corporativo para la generación, gestión, firma digital, análisis con Inteligencia Artificial y exportación multiformato de Informes Técnicos de Maquinaria y Grupos Electrógenos Caterpillar (CAT) para **Venequip S.A.**

---

## 🚀 Características Principales

- **Editor Técnico Completo**: Registro de datos de cliente, máquina, horómetro, síntomas de falla, antecedentes, pruebas de diagnóstico y repuestos requeridos.
- **Firma Digital en Pantalla**: Canvas interactivo con captura táctil y de ratón para las firmas de *Elaborado por*, *Revisado por* y *Aprobado por*.
- **Asistente Técnico IA (Google Gemini)**: Redacción técnica asistida, pulido de causa raíz, recomendaciones técnicas y análisis fotográfico.
- **Exportación Multiformato**:
  - 📄 **PDF Oficial**: Formato corporativo listo para imprimir o enviar al cliente.
  - 📝 **Microsoft Word (.docx)**: Documento editable con tablas y estilos.
  - 📊 **Microsoft Excel (.xlsx)**: Resumen y desglose de repuestos y tiempos.
  - 🌐 **Página Web Autónoma (.html)**: Vista imprimible sin dependencias.
  - 📦 **JSON**: Respaldo e intercambio de datos.
- **Dashboard de Analíticas**: Gráficos interactivos con métricas de clientes frecuentes, modelos atendidos y usuarios activos.
- **Gestión de Usuarios y Roles**: Administración de cuentas para Administrador, Técnicos, Supervisores y Gerencia con cambio de contraseñas exclusivo.
- **Sincronización con Google Workspace / Drive**: Respaldo automático de expedientes y registros en la nube.

---

## 🔑 Credenciales por Defecto

- **Administrador General**: `kescalonaccv@gmail.com` / Contraseña: `admin1234`
- **Técnico Especialista**: `tecnico@venequip.com` / Contraseña: `tecnico2026`

---

## 📤 Cómo Subir a GitHub

### Opción A (Recomendada desde Google AI Studio):
1. En la barra superior de Google AI Studio, abre el menú de opciones (⚙️ o menú de compartir).
2. Haz clic en **"Export to GitHub"**.
3. Selecciona tu cuenta de GitHub, ingresa el nombre de tu repositorio (ej. `venequip-informes-tecnicos`) y pulsa **Export**.

### Opción B (Descargando el archivo ZIP):
1. Descarga el ZIP desde Google AI Studio y descomprímelo en tu computadora.
2. Abre la terminal en la carpeta del proyecto y ejecuta:
```bash
git init
git add .
git commit -m "feat: Sistema de Informes Tecnicos Venequip"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
git push -u origin main
```

---

## ⚡ Cómo Desplegar en Vercel sin Errores

1. Ingresa a tu cuenta en [Vercel](https://vercel.com) e inicia sesión con GitHub.
2. Haz clic en **"Add New..."** ➔ **"Project"**.
3. En la lista de repositorios de GitHub, selecciona tu repositorio de Venequip y haz clic en **Import**.
4. Vercel detectará automáticamente la configuración:
   - **Framework Preset**: `Vite`
   - **Build Command**: `vite build` (configurado en `vercel.json`)
   - **Output Directory**: `dist`
5. (Opcional) En la sección **Environment Variables**, agrega tu clave de IA si la tienes:
   - `GEMINI_API_KEY`: Tu clave de Google AI Studio
6. Haz clic en **Deploy**. ¡Listo! En menos de 1 minuto tu aplicación estará desplegada y 100% operativa.

---

## 📦 Ejecución Local

```bash
npm install
npm run dev
```
La aplicación estará disponible en `http://localhost:3000`.

---

## 📄 Licencia

Desarrollado para uso corporativo en operaciones de servicio técnico y mantenimiento Caterpillar por Consorcio de Cogestión Venequip S.A.
