# Calendarios con acceso directo

Versión 2.9.426. Las vistas de consolidación y horarios publicados ofrecen SINCRONIZAR CON GOOGLE y SINCRONIZAR CON APPLE. El enlace se prepara automáticamente y abre la suscripción en el servicio elegido; la persona confirma allí. Google recibe el enlace mediante cid y Apple mediante webcal. Si el navegador no lo permite, se muestra un botón para continuar y una configuración manual plegada. No se declara la suscripción completada sin la confirmación en el servicio.

TODOS reúne planta y ambos ciclos para las cuentas de profesores. Los eventos identifican PLANTA, 1ER CICLO o 2DO CICLO y conservan los UID individuales. Los cursantes solo obtienen su ciclo; se comprueba también al leer el calendario por enlace, incluyendo enlaces obtenidos anteriormente.

El servidor conserva la autenticación por sesión institucional y enlaces personales revocables. Las suscripciones incluyen únicamente semanas publicadas. La actualización depende de la frecuencia de consulta de Google o Apple.

Ampliación de la restricción de valores de la tabla existente, sin cambiar privilegios ni RLS:

```sql
begin;
alter table public.planif_calendario_enlaces drop constraint planif_calendario_enlaces_audiencia_check;
alter table public.planif_calendario_enlaces add constraint planif_calendario_enlaces_audiencia_check check (audiencia in ('todos','planta','c1','c2'));
commit;
```

Validación: 30 pruebas de horarios y permisos, incluyendo rechazo de TODOS para cursantes, calendario combinado con tres audiencias y construcción de destinos de suscripción.
