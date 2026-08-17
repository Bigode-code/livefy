/* eslint-disable react-refresh/only-export-components -- provider and its hook form one small i18n boundary */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { extraTranslations } from './locales-extra';

export type Locale='en'|'pt-BR'|'es'|'zh-CN'|'de-DE'|'ru-RU';
export type Currency='USD'|'BRL'|'EUR'|'CNY'|'RUB'|'GBP'|'CAD'|'AUD'|'MXN';
type Entry=[string,string,string];

export const localeOptions:{locale:Locale;label:string;short:string;currency:Currency}[]=[
  {locale:'en',label:'English',short:'EN',currency:'USD'},
  {locale:'pt-BR',label:'Português (BR)',short:'PT-BR',currency:'BRL'},
  {locale:'es',label:'Español',short:'ES',currency:'EUR'},
  {locale:'zh-CN',label:'中文',short:'中文',currency:'CNY'},
  {locale:'de-DE',label:'Deutsch',short:'DE',currency:'EUR'},
  {locale:'ru-RU',label:'Русский',short:'RU',currency:'RUB'},
];
export const currencyOptions:Currency[]=['USD','BRL','EUR','CNY','RUB','GBP','CAD','AUD','MXN'];

const entries:Record<string,Entry>={
  'Control Center':['Central de Controle','Centro de Control','控制中心'],'Search or run a command':['Pesquisar ou executar comando','Buscar o ejecutar un comando','搜索或运行命令'],'Language':['Idioma','Idioma','语言'],'LIVE':['AO VIVO','EN VIVO','直播'],'watching':['assistindo','viendo','正在观看'],'Pause automation':['Pausar automação','Pausar automatización','暂停自动化'],'Close navigation':['Fechar navegação','Cerrar navegación','关闭导航'],'Toggle navigation':['Alternar navegação','Alternar navegación','切换导航'],'Notifications':['Notificações','Notificaciones','通知'],'Workspace':['Espaço de trabalho','Espacio de trabajo','工作区'],'Operate':['Operar','Operar','运营'],'Automate':['Automatizar','Automatizar','自动化'],'Monitor':['Monitorar','Supervisar','监控'],'System':['Sistema','Sistema','系统'],'Overview':['Visão geral','Resumen','概览'],'LIVE Control':['Controle da LIVE','Control EN VIVO','直播控制'],'Media':['Mídia','Medios','媒体'],'Products':['Produtos','Productos','商品'],'Automation':['Automação','Automatización','自动化'],'Rules':['Regras','Reglas','规则'],'Comments':['Comentários','Comentarios','评论'],'AI':['IA','IA','AI'],'Analytics':['Análises','Analítica','分析'],'Event Log':['Registro de eventos','Registro de eventos','事件日志'],'Compliance':['Conformidade','Cumplimiento','合规'],'Diagnostics':['Diagnósticos','Diagnóstico','诊断'],'Settings':['Configurações','Configuración','设置'],'Runtime healthy':['Runtime saudável','Runtime saludable','运行时正常'],'All systems nominal':['Todos os sistemas normais','Todos los sistemas normales','所有系统正常'],'Component lab':['Laboratório de componentes','Laboratorio de componentes','组件实验室'],
  'Sunday, August 16':['Domingo, 16 de agosto','Domingo, 16 de agosto','8月16日，星期日'],'Session overview':['Visão geral da sessão','Resumen de la sesión','会话概览'],'A live operational view of commerce, media, and automation.':['Uma visão operacional ao vivo de comércio, mídia e automação.','Una vista operativa en vivo de comercio, medios y automatización.','商业、媒体和自动化的实时运营视图。'],'Refresh':['Atualizar','Actualizar','刷新'],'Start control':['Iniciar controle','Iniciar control','开始控制'],'Active':['Ativa','Activa','进行中'],'Summer Studio LIVE':['LIVE Estúdio de Verão','EN VIVO Estudio de Verano','夏日直播间'],'Session duration':['Duração da sessão','Duración de la sesión','会话时长'],'Started at 13:21':['Iniciada às 13:21','Iniciada a las 13:21','开始于 13:21'],'Viewers':['Espectadores','Espectadores','观众'],'GMV':['GMV','GMV','成交总额'],'Orders':['Pedidos','Pedidos','订单'],'Comments / min':['Comentários/min','Comentarios/min','评论/分钟'],'↑ 18% in 5 min':['↑ 18% em 5 min','↑ 18% en 5 min','5分钟内 ↑18%'],'+$684 this hour':['+$684 nesta hora','+$684 esta hora','本小时 +$684'],'1.8% conversion':['1,8% de conversão','1,8% de conversión','1.8% 转化率'],'Stable volume':['Volume estável','Volumen estable','流量稳定'],'Current product':['Produto atual','Producto actual','当前商品'],'Pinned 02:14':['Fixado 02:14','Fijado 02:14','已置顶 02:14'],'View product':['Ver produto','Ver producto','查看商品'],'Media output':['Saída de mídia','Salida de medios','媒体输出'],'Open automation':['Abrir automação','Abrir automatización','打开自动化'],'Running':['Em execução','En ejecución','运行中'],'Balanced rotation':['Rotação equilibrada','Rotación equilibrada','均衡轮换'],'Recent activity':['Atividade recente','Actividad reciente','最近活动'],'View event log':['Ver registro de eventos','Ver registro de eventos','查看事件日志'],'Confirmed':['Confirmado','Confirmado','已确认'],'Recorded':['Registrado','Registrado','已记录'],
  'Direct control of the active session and its automation runtime.':['Controle direto da sessão ativa e do runtime de automação.','Control directo de la sesión activa y su runtime de automatización.','直接控制活动会话及其自动化运行时。'],'End LIVE':['Encerrar LIVE','Finalizar EN VIVO','结束直播'],'LIVE active':['LIVE ativa','EN VIVO activo','直播进行中'],'Automation running':['Automação em execução','Automatización en ejecución','自动化运行中'],'Next action in 00:46':['Próxima ação em 00:46','Próxima acción en 00:46','下一个操作 00:46 后'],'Camera healthy':['Câmera saudável','Cámara saludable','摄像头正常'],'Now pinned':['Fixado agora','Fijado ahora','当前置顶'],'Restart timer':['Reiniciar cronômetro','Reiniciar temporizador','重启计时器'],'Unpin':['Desafixar','Desfijar','取消置顶'],'Up next':['A seguir','A continuación','接下来'],'Pin now':['Fixar agora','Fijar ahora','立即置顶'],'Operator controls':['Controles do operador','Controles del operador','操作员控制'],'Skip product':['Pular produto','Omitir producto','跳过商品'],'Previous product':['Produto anterior','Producto anterior','上一个商品'],'Open media output':['Abrir saída de mídia','Abrir salida de medios','打开媒体输出'],'Critical actions':['Ações críticas','Acciones críticas','关键操作'],'Stop runtime':['Parar runtime','Detener runtime','停止运行时'],'Ends automation and media processing without ending the TikTok LIVE.':['Encerra a automação e o processamento de mídia sem finalizar a LIVE do TikTok.','Detiene la automatización y el procesamiento de medios sin finalizar el EN VIVO de TikTok.','停止自动化和媒体处理，但不结束 TikTok 直播。'],
  'Catalog':['Catálogo','Catálogo','目录'],'Products detected from TikTok LIVE Manager and their session performance.':['Produtos detectados no TikTok LIVE Manager e o desempenho na sessão.','Productos detectados en TikTok LIVE Manager y su rendimiento en la sesión.','从 TikTok LIVE Manager 检测到的商品及其会话表现。'],'Sync products':['Sincronizar produtos','Sincronizar productos','同步商品'],'Search products':['Pesquisar produtos','Buscar productos','搜索商品'],'All statuses':['Todos os status','Todos los estados','所有状态'],'4 products · synced just now':['4 produtos · sincronizados agora','4 productos · sincronizados ahora','4 件商品 · 刚刚同步'],'Product':['Produto','Producto','商品'],'Price':['Preço','Precio','价格'],'Status':['Status','Estado','状态'],'Rotation':['Rotação','Rotación','轮换'],'Pinned':['Fixado','Fijado','已置顶'],'Queued':['Na fila','En cola','排队中'],'Available':['Disponível','Disponible','可用'],
  'Output':['Saída','Salida','输出'],'Playback, playlist, and virtual-camera health.':['Reprodução, playlist e integridade da câmera virtual.','Reproducción, lista y estado de la cámara virtual.','播放、播放列表和虚拟摄像头状态。'],'Add media':['Adicionar mídia','Añadir medio','添加媒体'],'Media timeline':['Linha do tempo da mídia','Línea de tiempo del medio','媒体时间轴'],'Playlist':['Playlist','Lista de reproducción','播放列表'],'Playing · 12:32':['Reproduzindo · 12:32','Reproduciendo · 12:32','播放中 · 12:32'],'Ready · 04:18':['Pronto · 04:18','Listo · 04:18','就绪 · 04:18'],'Output health':['Integridade da saída','Estado de la salida','输出状态'],'Virtual camera active':['Câmera virtual ativa','Cámara virtual activa','虚拟摄像头已启用'],'Visible to Chrome · last frame 8 ms ago':['Visível no Chrome · último quadro há 8 ms','Visible en Chrome · último fotograma hace 8 ms','Chrome 可见 · 上一帧在 8 毫秒前'],'Resolution':['Resolução','Resolución','分辨率'],'Portrait output':['Saída vertical','Salida vertical','竖屏输出'],'Frame rate':['Taxa de quadros','Frecuencia de fotogramas','帧率'],'0 dropped frames':['0 quadros perdidos','0 fotogramas perdidos','0 丢帧'],'Decoder':['Decodificador','Decodificador','解码器'],'Healthy':['Saudável','Saludable','正常'],'Hardware accelerated':['Aceleração por hardware','Aceleración por hardware','硬件加速'],
  'A readable account of what the system is doing and why.':['Uma explicação clara do que o sistema está fazendo e por quê.','Una explicación clara de lo que hace el sistema y por qué.','清晰说明系统正在做什么以及原因。'],'Next scheduled action':['Próxima ação programada','Próxima acción programada','下一个计划操作'],'Product queue':['Fila de produtos','Cola de productos','商品队列'],'Reorder':['Reordenar','Reordenar','重新排序'],'Currently pinned':['Fixado atualmente','Fijado actualmente','当前已置顶'],'Waiting':['Aguardando','Esperando','等待中'],'Recent decisions':['Decisões recentes','Decisiones recientes','最近决策'],'Rotation continued':['Rotação mantida','Rotación continuada','继续轮换'],'Order velocity remained within the expected range.':['A velocidade de pedidos permaneceu dentro do esperado.','La velocidad de pedidos se mantuvo dentro del rango esperado.','订单速度保持在预期范围内。'],'Product extended by 30 seconds':['Produto estendido por 30 segundos','Producto extendido 30 segundos','商品延长 30 秒'],'Six high-intent questions referenced the current product.':['Seis perguntas de alta intenção mencionaram o produto atual.','Seis preguntas de alta intención mencionaron el producto actual.','六个高意向问题提到了当前商品。'],
  'Build deterministic responses to live session events.':['Crie respostas determinísticas para eventos da sessão ao vivo.','Cree respuestas deterministas para eventos de la sesión en vivo.','为直播会话事件构建确定性响应。'],'New rule':['Nova regra','Nueva regla','新建规则'],'Shipping question response':['Resposta para pergunta de envio','Respuesta a pregunta de envío','配送问题回复'],'When':['Quando','Cuando','当'],'Comment received':['Comentário recebido','Comentario recibido','收到评论'],'If':['Se','Si','如果'],'Message':['Mensagem','Mensaje','消息'],'contains':['contém','contiene','包含'],'Then':['Então','Entonces','则'],'Send saved response':['Enviar resposta salva','Enviar respuesta guardada','发送已保存回复'],'Add condition':['Adicionar condição','Añadir condición','添加条件'],'Add action':['Adicionar ação','Añadir acción','添加操作'],'Save rule':['Salvar regra','Guardar regla','保存规则'],'Active rules':['Regras ativas','Reglas activas','活动规则'],'Pause on compliance warning':['Pausar em alerta de conformidade','Pausar ante alerta de cumplimiento','合规警告时暂停'],'Immediately halt mutations when a warning is detected.':['Interrompa imediatamente as alterações ao detectar um alerta.','Detenga inmediatamente los cambios al detectar una alerta.','检测到警告时立即停止变更。'],'Notify on order milestone':['Notificar em marco de pedidos','Notificar hito de pedidos','订单里程碑通知'],'Send Pushcut at each $1,000 GMV threshold.':['Enviar Pushcut a cada US$ 1.000 de GMV.','Enviar Pushcut por cada umbral de $1.000 de GMV.','每达到 1,000 美元成交额时发送 Pushcut。'],'Reply to delivery questions':['Responder perguntas de entrega','Responder preguntas de entrega','回复配送问题'],'Use the approved delivery FAQ response.':['Usar a resposta aprovada do FAQ de entrega.','Usar la respuesta aprobada de preguntas de entrega.','使用已批准的配送常见问题回复。'],
  'Engage':['Interagir','Interactuar','互动'],'Moderate questions and inspect automated responses.':['Modere perguntas e inspecione respostas automatizadas.','Modere preguntas e inspeccione respuestas automatizadas.','审核问题并检查自动回复。'],'Search comments':['Pesquisar comentários','Buscar comentarios','搜索评论'],'All':['Todos','Todos','全部'],'Questions':['Perguntas','Preguntas','问题'],'Unanswered':['Sem resposta','Sin responder','未回复'],'Comment details':['Detalhes do comentário','Detalles del comentario','评论详情'],'Question detected':['Pergunta detectada','Pregunta detectada','检测到问题'],'Reply':['Resposta','Respuesta','回复'],'Dismiss':['Dispensar','Descartar','忽略'],'Send reply':['Enviar resposta','Enviar respuesta','发送回复'],
  'Configure secure operational alerts through Pushcut.':['Configure alertas operacionais seguros pelo Pushcut.','Configure alertas operativos seguros mediante Pushcut.','通过 Pushcut 配置安全运营警报。'],'Test notification':['Testar notificação','Probar notificación','测试通知'],'Pushcut connection':['Conexão Pushcut','Conexión Pushcut','Pushcut 连接'],'Connected':['Conectado','Conectado','已连接'],'Operational notifications':['Notificações operacionais','Notificaciones operativas','运营通知'],'Last delivery succeeded 3 minutes ago':['Último envio concluído há 3 minutos','Último envío exitoso hace 3 minutos','上次发送成功于 3 分钟前'],'Disconnect':['Desconectar','Desconectar','断开连接'],'Webhook URL':['URL do webhook','URL del webhook','Webhook URL'],'Stored securely by the desktop runtime.':['Armazenada com segurança pelo runtime desktop.','Almacenada de forma segura por el runtime de escritorio.','由桌面运行时安全存储。'],'Notification name':['Nome da notificação','Nombre de la notificación','通知名称'],'Events':['Eventos','Eventos','事件'],'LIVE started and ended':['LIVE iniciada e encerrada','EN VIVO iniciado y finalizado','直播开始和结束'],'Session boundary notifications.':['Notificações de início e fim da sessão.','Notificaciones de inicio y fin de sesión.','会话开始和结束通知。'],'Orders and GMV milestones':['Pedidos e marcos de GMV','Pedidos e hitos de GMV','订单和成交额里程碑'],'Warnings and violations':['Alertas e violações','Alertas e infracciones','警告和违规'],'System failures':['Falhas do sistema','Fallos del sistema','系统故障'],
  'Health and evidence for every runtime subsystem.':['Integridade e evidências de cada subsistema do runtime.','Estado y evidencias de cada subsistema del runtime.','每个运行时子系统的健康状态和证据。'],'Run diagnostics':['Executar diagnósticos','Ejecutar diagnóstico','运行诊断'],'Core systems are healthy':['Os sistemas principais estão saudáveis','Los sistemas principales están saludables','核心系统正常'],'AI capacity is reduced but live operations are unaffected.':['A capacidade de IA está reduzida, mas as operações ao vivo não foram afetadas.','La capacidad de IA está reducida, pero las operaciones en vivo no se ven afectadas.','AI 容量降低，但直播运营不受影响。'],'Components':['Componentes','Componentes','组件'],'Degraded':['Degradado','Degradado','性能下降'],
  'Application behavior, appearance, and secure connections.':['Comportamento, aparência e conexões seguras do aplicativo.','Comportamiento, apariencia y conexiones seguras de la aplicación.','应用行为、外观和安全连接。'],'Save changes':['Salvar alterações','Guardar cambios','保存更改'],'Appearance':['Aparência','Apariencia','外观'],'Interface density':['Densidade da interface','Densidad de interfaz','界面密度'],'Comfortable':['Confortável','Cómoda','舒适'],'Session behavior':['Comportamento da sessão','Comportamiento de sesión','会话行为'],'Restore interrupted sessions':['Restaurar sessões interrompidas','Restaurar sesiones interrumpidas','恢复中断的会话'],'Confirm critical actions':['Confirmar ações críticas','Confirmar acciones críticas','确认关键操作'],'Keep event history':['Manter histórico de eventos','Conservar historial de eventos','保留事件历史'],'Local protocol':['Protocolo local','Protocolo local','本地协议'],'Runtime address':['Endereço do runtime','Dirección del runtime','运行时地址'],'Localhost connections only.':['Somente conexões localhost.','Solo conexiones localhost.','仅限本地主机连接。'],'Heartbeat interval':['Intervalo de heartbeat','Intervalo de heartbeat','心跳间隔'],
  'Everything is clear':['Tudo está normal','Todo está despejado','一切正常'],'New operational items will appear here as the session changes.':['Novos itens operacionais aparecerão aqui conforme a sessão mudar.','Los nuevos elementos operativos aparecerán aquí a medida que cambie la sesión.','会话变化时，新的运营项目将显示在这里。'],'Loading':['Carregando','Cargando','加载中'],'Synchronizing products':['Sincronizando produtos','Sincronizando productos','正在同步商品'],'Internal':['Interno','Interno','内部'],'Component Lab':['Laboratório de Componentes','Laboratorio de Componentes','组件实验室'],'Canonical states, long-content stress tests, and form validation.':['Estados canônicos, testes de conteúdo longo e validação de formulários.','Estados canónicos, pruebas de contenido largo y validación de formularios.','规范状态、长内容压力测试和表单验证。'],'Actions':['Ações','Acciones','操作'],'Fields':['Campos','Campos','字段'],'Empty state':['Estado vazio','Estado vacío','空状态']
};

Object.assign(entries, {
  'Performance':['Desempenho','Rendimiento','表现'],
  'Order velocity':['Velocidade dos pedidos','Velocidad de pedidos','订单速度'],
  'Chart view':['Visualização do gráfico','Vista del gráfico','图表视图'],
  'Curve view':['Visualização em linha','Vista de línea','折线图'],
  'Bar view':['Visualização em barras','Vista de barras','柱状图'],
  'Period':['Período','Período','周期'],
  'Last 30 min':['Últimos 30 min','Últimos 30 min','最近 30 分钟'],
  'Last hour':['Última hora','Última hora','最近一小时'],
  'Full session':['Sessão completa','Sesión completa','完整会话'],
  '30 min':['30 min','30 min','30 分钟'],
  '1 hour':['1 hora','1 hora','1 小时'],
  'Session':['Sessão','Sesión','会话'],
  'last 5 min':['nos últimos 5 min','en los últimos 5 min','最近 5 分钟'],
  'in 5 min':['em 5 min','en 5 min','5 分钟内'],
  'today':['hoje','hoy','今天'],
  'orders':['pedidos','pedidos','订单'],
  'trend':['tendência','tendencia','趋势'],
  'peak':['pico','máximo','峰值'],
  'low':['mínimo','mínimo','最低值'],
  'avg':['média','promedio','平均值'],
  'No data yet':['Ainda não há dados','Aún no hay datos','暂无数据'],
  'Metrics will appear once data is available.':['As métricas aparecerão quando houver dados disponíveis.','Las métricas aparecerán cuando haya datos disponibles.','有数据后将显示指标。'],
  'Dashboard views':['Visões da dashboard','Vistas del dashboard','仪表板视图'],
  'Product performance':['Desempenho dos produtos','Rendimiento de productos','商品表现'],
  'Comment activity':['Atividade de comentários','Actividad de comentarios','评论动态'],
  'Toggle color theme':['Alternar tema de cores','Cambiar tema de color','切换颜色主题'],
  'Primary navigation':['Navegação principal','Navegación principal','主导航'],
  '1,284 watching':['1.284 assistindo','1.284 viendo','1,284 人正在观看'],
  '1,284 viewers':['1.284 espectadores','1.284 espectadores','1,284 名观众'],
  '31 orders · $2,759 GMV':['31 pedidos · US$ 2.759 de GMV','31 pedidos · $2.759 de GMV','31 个订单 · 成交额 $2,759'],
  '$89.00 · 31 orders · $2,759 GMV':['US$ 89,00 · 31 pedidos · US$ 2.759 de GMV','$89,00 · 31 pedidos · $2.759 de GMV','$89.00 · 31 个订单 · 成交额 $2,759'],
  'Next: AeroClip Wireless Microphone Duo in 00:46':['Próximo: AeroClip Wireless Microphone Duo em 00:46','Siguiente: AeroClip Wireless Microphone Duo en 00:46','下一个：AeroClip 无线麦克风套装，00:46 后'],
  'Order #LF-84291 confirmed':['Pedido #LF-84291 confirmado','Pedido #LF-84291 confirmado','订单 #LF-84291 已确认'],
  'Shipping question answered by FAQ rule':['Pergunta sobre envio respondida pela regra de FAQ','Pregunta de envío respondida por la regla de preguntas frecuentes','配送问题已由常见问题规则回复'],
  'LumaFlex Pro pinned':['LumaFlex Pro fixado','LumaFlex Pro fijado','LumaFlex Pro 已置顶'],
  'High-intent comment matched':['Comentário de alta intenção identificado','Comentario de alta intención detectado','已匹配高意向评论'],
  'Session started':['Sessão iniciada','Sesión iniciada','会话已开始'],
  'ORDER':['PEDIDO','PEDIDO','订单'],
  'REPLY':['RESPOSTA','RESPUESTA','回复'],
  'PRODUCT':['PRODUTO','PRODUCTO','商品'],
  'RULE':['REGRA','REGLA','规则'],
  '01:00 rotation':['rotação de 01:00','rotación de 01:00','轮换 01:00'],
  '01:30 rotation':['rotação de 01:30','rotación de 01:30','轮换 01:30'],
  '00:45 rotation':['rotação de 00:45','rotación de 00:45','轮换 00:45'],
  'Products rotate sequentially using their configured duration. High-intent comment volume can extend a product by up to 30 seconds.':['Os produtos alternam em sequência conforme a duração configurada. Um volume alto de comentários com intenção de compra pode estender um produto por até 30 segundos.','Los productos rotan en secuencia según su duración configurada. Un volumen alto de comentarios con intención de compra puede extender un producto hasta 30 segundos.','商品会按设定时长依次轮换。高意向评论增多时，商品展示最多可延长 30 秒。'],
  'Pin AeroClip Wireless Microphone Duo':['Fixar AeroClip Wireless Microphone Duo','Fijar AeroClip Wireless Microphone Duo','置顶 AeroClip 无线麦克风套装'],
  '01:00 duration':['duração de 01:00','duración de 01:00','时长 01:00'],
  '01:30 duration':['duração de 01:30','duración de 01:30','时长 01:30'],
  '00:45 duration':['duração de 00:45','duración de 00:45','时长 00:45'],
  '16 sec ago':['há 16 s','hace 16 s','16 秒前'],
  '2 min ago':['há 2 min','hace 2 min','2 分钟前'],
  'More options for LumaFlex Pro Studio Light — Creator Edition':['Mais opções para LumaFlex Pro Studio Light — Creator Edition','Más opciones para LumaFlex Pro Studio Light — Creator Edition','LumaFlex Pro Studio Light — Creator Edition 的更多选项'],
  'More options for AeroClip Wireless Microphone Duo':['Mais opções para AeroClip Wireless Microphone Duo','Más opciones para AeroClip Wireless Microphone Duo','AeroClip Wireless Microphone Duo 的更多选项'],
  'More options for CanvasFold Portable Product Backdrop':['Mais opções para CanvasFold Portable Product Backdrop','Más opciones para CanvasFold Portable Product Backdrop','CanvasFold Portable Product Backdrop 的更多选项'],
  'More options for Orbit Stand 360° Tracking Mount':['Mais opções para Orbit Stand 360° Tracking Mount','Más opciones para Orbit Stand 360° Tracking Mount','Orbit Stand 360° Tracking Mount 的更多选项'],
  'LIVE OUTPUT':['SAÍDA AO VIVO','SALIDA EN VIVO','直播输出'],
  '3 items':['3 itens','3 elementos','3 项'],
  'shipping':['envio','envío','配送'],
  'Question · Unanswered':['Pergunta · Sem resposta','Pregunta · Sin responder','问题 · 未回复'],
  'FAQ answered · 18 sec ago':['FAQ respondida · há 18 s','Preguntas frecuentes respondidas · hace 18 s','常见问题已回复 · 18 秒前'],
  'AI candidate · Waiting':['Candidata à IA · Aguardando','Candidato de IA · Esperando','AI 候选 · 等待中'],
  'General comment':['Comentário geral','Comentario general','普通评论'],
  'Does this light include the desk clamp?':['Esta luz inclui o grampo de mesa?','¿Esta luz incluye la abrazadera de escritorio?','这款灯包含桌面夹具吗？'],
  'How long does shipping take to Curitiba?':['Quanto tempo demora a entrega para Curitiba?','¿Cuánto tarda el envío a Curitiba?','配送到库里蒂巴需要多久？'],
  'Can I use two microphones at once?':['Posso usar dois microfones ao mesmo tempo?','¿Puedo usar dos micrófonos a la vez?','可以同时使用两个麦克风吗？'],
  'The tracking mount looks really smooth':['O suporte de rastreamento parece muito suave','El soporte de seguimiento se ve muy fluido','追踪支架看起来非常流畅'],
  'Yes — the LumaFlex Pro includes the adjustable desk clamp shown in the demonstration.':['Sim — a LumaFlex Pro inclui o grampo de mesa ajustável mostrado na demonstração.','Sí, LumaFlex Pro incluye la abrazadera de escritorio ajustable mostrada en la demostración.','是的，LumaFlex Pro 包含演示中展示的可调桌面夹具。'],
  'New orders and configured revenue thresholds.':['Novos pedidos e limites de receita configurados.','Nuevos pedidos y umbrales de ingresos configurados.','新订单和已配置的收入阈值。'],
  'Compliance events that may pause automation.':['Eventos de conformidade que podem pausar a automação.','Eventos de cumplimiento que pueden pausar la automatización.','可能暂停自动化的合规事件。'],
  'Runtime, media, camera, AI, and persistence failures.':['Falhas de runtime, mídia, câmera, IA e persistência.','Fallos de runtime, medios, cámara, IA y persistencia.','运行时、媒体、摄像头、AI 和持久化故障。'],
  'Chrome Extension':['Extensão do Chrome','Extensión de Chrome','Chrome 扩展程序'],
  'TikTok page observed 41 ms ago':['Página do TikTok observada há 41 ms','Página de TikTok observada hace 41 ms','41 毫秒前检测到 TikTok 页面'],
  'TikTok Adapter':['Adaptador do TikTok','Adaptador de TikTok','TikTok 适配器'],
  'Selector profile v3 · confidence 96%':['Perfil de seletor v3 · confiança de 96%','Perfil de selector v3 · confianza del 96%','选择器配置 v3 · 置信度 96%'],
  'Action Queue':['Fila de ações','Cola de acciones','操作队列'],
  '0 pending · 18 ms median':['0 pendentes · mediana de 18 ms','0 pendientes · mediana de 18 ms','0 个待处理 · 中位数 18 毫秒'],
  'Desktop Runtime':['Runtime do desktop','Runtime de escritorio','桌面运行时'],
  'Heartbeat 8 ms ago':['Heartbeat há 8 ms','Heartbeat hace 8 ms','8 毫秒前收到心跳'],
  'Media Decoder':['Decodificador de mídia','Decodificador de medios','媒体解码器'],
  'Hardware acceleration active':['Aceleração por hardware ativa','Aceleración por hardware activa','硬件加速已启用'],
  'Virtual Camera':['Câmera virtual','Cámara virtual','虚拟摄像头'],
  '30 FPS · 0 frames dropped':['30 FPS · 0 quadros perdidos','30 FPS · 0 fotogramas perdidos','30 FPS · 0 丢帧'],
  'Last delivery 3 min ago':['Último envio há 3 min','Último envío hace 3 min','上次发送于 3 分钟前'],
  'AI Provider':['Provedor de IA','Proveedor de IA','AI 提供商'],
  'Rate limit headroom 18%':['Margem do limite de taxa: 18%','Margen del límite de tasa: 18%','速率限制余量 18%'],
  '1 degraded':['1 degradado','1 degradado','1 项性能下降'],
  'System':['Sistema','Sistema','系统'],
  'Light':['Claro','Claro','浅色'],
  'Dark':['Escuro','Oscuro','深色'],
  'Reconnect to an active runtime after the control center restarts.':['Reconectar a um runtime ativo após reiniciar a central de controle.','Reconectar a un runtime activo después de reiniciar el centro de control.','控制中心重启后重新连接到活动运行时。'],
  'Require confirmation before ending LIVE or stopping the runtime.':['Exigir confirmação antes de encerrar a LIVE ou parar o runtime.','Solicitar confirmación antes de finalizar el EN VIVO o detener el runtime.','结束直播或停止运行时前要求确认。'],
  'Retain structured event history for 30 days.':['Manter o histórico estruturado de eventos por 30 dias.','Conservar el historial estructurado de eventos durante 30 días.','保留 30 天的结构化事件历史。'],
  '5 seconds':['5 segundos','5 segundos','5 秒'],
  'Provider configuration, behavior limits, and recent model decisions.':['Configuração do provedor, limites de comportamento e decisões recentes do modelo.','Configuración del proveedor, límites de comportamiento y decisiones recientes del modelo.','提供商配置、行为限制和近期模型决策。'],
  'Session performance across viewers, commerce, and products.':['Desempenho da sessão em espectadores, comércio e produtos.','Rendimiento de la sesión en espectadores, comercio y productos.','会话在观众、交易和商品方面的表现。'],
  'A structured operational timeline for the current session.':['Uma linha do tempo operacional estruturada para a sessão atual.','Una línea de tiempo operativa estructurada para la sesión actual.','当前会话的结构化运营时间线。'],
  'Warnings, restrictions, and automated safety responses.':['Alertas, restrições e respostas automáticas de segurança.','Alertas, restricciones y respuestas automáticas de seguridad.','警告、限制和自动安全响应。'],
  'Search event log':['Pesquisar registro de eventos','Buscar en el registro de eventos','搜索事件日志'],
  'All events':['Todos os eventos','Todos los eventos','所有事件'],
  'This session':['Esta sessão','Esta sesión','本次会话'],
  'No active warnings':['Nenhum alerta ativo','No hay alertas activos','无活动警告'],
  'Visible TikTok compliance surfaces are being observed. Automation will pause on critical detection.':['As superfícies visíveis de conformidade do TikTok estão sendo monitoradas. A automação será pausada ao detectar algo crítico.','Se supervisan las superficies visibles de cumplimiento de TikTok. La automatización se pausará ante una detección crítica.','正在监控可见的 TikTok 合规界面。检测到严重问题时将暂停自动化。'],
  'Monitoring':['Monitorando','Supervisando','监控中'],
  'Recent checks':['Verificações recentes','Comprobaciones recientes','最近检查'],
  'Canonical design-system states and stress tests.':['Estados canônicos do design system e testes de estresse.','Estados canónicos del sistema de diseño y pruebas de estrés.','设计系统规范状态和压力测试。'],
  'Operational summary':['Resumo operacional','Resumen operativo','运营摘要'],
  'Requests':['Solicitações','Solicitudes','请求'],
  'Current session':['Sessão atual','Sesión actual','当前会话'],
  'Success':['Sucesso','Éxito','成功率'],
  'Within target':['Dentro da meta','Dentro del objetivo','符合目标'],
  'Latency':['Latência','Latencia','延迟'],
  'P95 response':['Resposta P95','Respuesta P95','P95 响应'],
  'Recent state':['Estado recente','Estado reciente','最近状态'],
  'Primary action':['Ação primária','Acción principal','主要操作'],
  'Secondary action':['Ação secundária','Acción secundaria','次要操作'],
  'Quiet action':['Ação discreta','Acción discreta','弱化操作'],
  'Destructive action':['Ação destrutiva','Acción destructiva','破坏性操作'],
  'Disabled action':['Ação desativada','Acción deshabilitada','已禁用操作'],
  'Online':['Online','En línea','在线'],
  'Warning':['Alerta','Advertencia','警告'],
  'Error':['Erro','Error','错误'],
  'Paused':['Pausado','Pausado','已暂停'],
  'Empty value':['Valor vazio','Valor vacío','空值'],
  'Enter a value':['Digite um valor','Ingrese un valor','输入值'],
  'Helpful field description.':['Descrição útil do campo.','Descripción útil del campo.','有用的字段说明。'],
  'Long product name':['Nome longo de produto','Nombre largo de producto','长商品名称'],
  'Validation error':['Erro de validação','Error de validación','验证错误'],
  'Enter a secure localhost WebSocket address.':['Digite um endereço WebSocket localhost seguro.','Ingrese una dirección WebSocket localhost segura.','输入安全的 localhost WebSocket 地址。'],
  'Disabled field':['Campo desativado','Campo deshabilitado','已禁用字段'],
  'Unavailable':['Indisponível','No disponible','不可用'],
  'Read-only field':['Campo somente leitura','Campo de solo lectura','只读字段']
} satisfies Record<string,Entry>);

Object.assign(entries,{
  'Secure access':['Acesso seguro','Acceso seguro','安全访问'],
  'Recover your account':['Recupere sua conta','Recupera tu cuenta','恢复账户'],
  'First name':['Nome','Nombre','名字'],
  'Last name':['Sobrenome','Apellido','姓氏'],
  'Email':['E-mail','Correo','邮箱'],
  'Sign up with Google':['Cadastrar com Google','Registrarse con Google','使用 Google 注册'],
  'Sign up with Apple':['Cadastrar com Apple','Registrarse con Apple','使用 Apple 注册'],
  'or':['ou','o','或'],
  "I don't want to receive emails about Livefy feature updates":['Não quero receber e-mails sobre atualizações de recursos da Livefy','No quiero recibir correos sobre actualizaciones de Livefy','我不想接收 Livefy 功能更新邮件'],
  'By creating an account, you agree to our':['Ao criar uma conta, você concorda com nossos','Al crear una cuenta, aceptas nuestros','创建账户即表示您同意我们的'],
  'Terms and Services':['Termos e Serviços','Términos y Servicios','条款与服务'],
  'We will send a secure recovery link to this email address.':['Enviaremos um link seguro de recuperação para este e-mail.','Enviaremos un enlace seguro de recuperación a este correo.','我们会向此邮箱发送安全恢复链接。'],
  'A live workspace for creators and commerce teams':['Um espaço ao vivo para criadores e equipes de comércio','Un espacio en vivo para creadores y equipos de comercio','面向创作者和商业团队的直播工作区'],
  'Livefy creative workspace':['Espaço criativo da Livefy','Espacio creativo de Livefy','Livefy 创意工作区'],
  'Live commerce creative reference':['Referência criativa de live commerce','Referencia creativa de live commerce','直播电商创意参考'],
  'Use current creative direction':['Usar direção criativa atual','Usar dirección creativa actual','使用当前创意方向'],
  'Show prompt 1':['Mostrar prompt 1','Mostrar prompt 1','显示提示词 1'],
  'Show prompt 2':['Mostrar prompt 2','Mostrar prompt 2','显示提示词 2'],
  'Show prompt 3':['Mostrar prompt 3','Mostrar prompt 3','显示提示词 3'],
  'Show prompt 4':['Mostrar prompt 4','Mostrar prompt 4','显示提示词 4'],
  'Build a cinematic product stage with warm summer light, precise camera movement, and natural color.':['Crie um palco cinematográfico de produto com luz quente de verão, movimento preciso de câmera e cor natural.','Crea un escenario cinematográfico de producto con luz cálida de verano, movimiento preciso de cámara y color natural.','用温暖夏日光线、精准镜头运动和自然色彩打造电影感商品舞台。'],
  'Create a premium commerce portrait with clean negative space, tactile detail, and studio lighting.':['Crie um retrato comercial premium com espaço negativo limpo, detalhes táteis e iluminação de estúdio.','Crea un retrato comercial prémium con espacio negativo limpio, detalle táctil e iluminación de estudio.','以干净留白、细腻质感和棚拍灯光打造高级商业肖像。'],
  'Direct a fast-paced live sequence through a brutalist set with controlled motion and sharp contrast.':['Dirija uma sequência ao vivo dinâmica em um cenário brutalista com movimento controlado e contraste nítido.','Dirige una secuencia en vivo dinámica en un escenario brutalista con movimiento controlado y contraste marcado.','在粗野主义场景中，以受控运动和鲜明对比呈现快节奏直播序列。'],
  'Design a retro campaign frame with strong character, editorial composition, and memorable product focus.':['Crie um quadro de campanha retrô com personalidade forte, composição editorial e foco marcante no produto.','Diseña un cuadro de campaña retro con carácter fuerte, composición editorial y enfoque memorable del producto.','设计具有鲜明个性、编辑构图和突出商品焦点的复古宣传画面。'],
  'Sign in to Livefy':['Entrar na Livefy','Iniciar sesión en Livefy','登录 Livefy'],
  'Sign in to Account':['Entrar na conta','Iniciar sesión en la cuenta','登录账户'],
  'Sign in to your Account.':['Entre na sua conta.','Inicia sesión en tu cuenta.','登录您的账户。'],
  'Sign in to your account.':['Entre na sua conta.','Inicia sesión en tu cuenta.','登录您的账户。'],
  'Continue with Email':['Continuar com e-mail','Continuar con correo','使用邮箱继续'],
  'Welcome back':['Boas-vindas de volta','Te damos la bienvenida','欢迎回来'],
  'Sign in to continue to your live control center.':['Entre para continuar à sua central de controle ao vivo.','Inicia sesión para continuar a tu centro de control en vivo.','登录以继续访问直播控制中心。'],
  'Sign in':['Entrar','Iniciar sesión','登录'],
  'Create workspace':['Criar espaço de trabalho','Crear espacio de trabajo','创建工作区'],
  'Sign up for Livefy':['Cadastre-se na Livefy','Regístrate en Livefy','注册 Livefy'],
  'Sign up for Account':['Cadastre-se','Regístrate','注册账户'],
  'Create a new account to get started.':['Crie uma nova conta para começar.','Crea una cuenta nueva para comenzar.','创建新账户以开始使用。'],
  'Sign up with Email':['Cadastrar com e-mail','Registrarse con correo','使用邮箱注册'],
  'Start with Livefy':['Comece com a Livefy','Comienza con Livefy','开始使用 Livefy'],
  'Create your account and prepare your first live workspace.':['Crie sua conta e prepare seu primeiro espaço de trabalho ao vivo.','Crea tu cuenta y prepara tu primer espacio de trabajo en vivo.','创建账户并准备第一个直播工作区。'],
  'Create account':['Criar conta','Crear cuenta','创建账户'],
  'Account recovery':['Recuperação de conta','Recuperación de cuenta','账户恢复'],
  'Reset your password':['Redefina sua senha','Restablece tu contraseña','重置密码'],
  'Enter your email and we will send you a secure recovery link.':['Digite seu e-mail e enviaremos um link seguro de recuperação.','Ingresa tu correo y te enviaremos un enlace seguro de recuperación.','输入邮箱，我们将发送安全的恢复链接。'],
  'Send recovery link':['Enviar link de recuperação','Enviar enlace de recuperación','发送恢复链接'],
  'Full name':['Nome completo','Nombre completo','全名'],
  'Your full name':['Seu nome completo','Tu nombre completo','您的全名'],
  'Work email':['E-mail profissional','Correo de trabajo','工作邮箱'],
  'Password':['Senha','Contraseña','密码'],
  'Confirm password':['Confirmar senha','Confirmar contraseña','确认密码'],
  'Show password':['Mostrar senha','Mostrar contraseña','显示密码'],
  'Hide password':['Ocultar senha','Ocultar contraseña','隐藏密码'],
  'Remember me':['Lembrar de mim','Recordarme','记住我'],
  'Forgot password?':['Esqueceu a senha?','¿Olvidaste tu contraseña?','忘记密码？'],
  'Passwords do not match.':['As senhas não coincidem.','Las contraseñas no coinciden.','密码不一致。'],
  'Please wait...':['Aguarde...','Espera...','请稍候...'],
  'or continue with':['ou continue com','o continúa con','或继续使用'],
  'Continue with Google':['Continuar com Google','Continuar con Google','使用 Google 继续'],
  'Continue with GitHub':['Continuar com GitHub','Continuar con GitHub','使用 GitHub 继续'],
  'Continue with Apple':['Continuar com Apple','Continuar con Apple','使用 Apple 继续'],
  'New to Livefy?':['Novo na Livefy?','¿Nuevo en Livefy?','初次使用 Livefy？'],
  'Create an account':['Criar uma conta','Crear una cuenta','创建账户'],
  'Already have an account?':['Já possui uma conta?','¿Ya tienes una cuenta?','已有账户？'],
  'Back to sign in':['Voltar para o login','Volver al inicio de sesión','返回登录'],
  'Account created':['Conta criada','Cuenta creada','账户已创建'],
  'Recovery email sent':['E-mail de recuperação enviado','Correo de recuperación enviado','恢复邮件已发送'],
  'Your account is ready. You can sign in now.':['Sua conta está pronta. Você já pode entrar.','Tu cuenta está lista. Ya puedes iniciar sesión.','账户已就绪，现在可以登录。'],
  'Check your inbox for the password recovery link.':['Verifique sua caixa de entrada para acessar o link de recuperação.','Revisa tu bandeja de entrada para encontrar el enlace de recuperación.','请检查收件箱中的密码恢复链接。'],
  'By continuing, you agree to our':['Ao continuar, você concorda com nossos','Al continuar, aceptas nuestros','继续即表示您同意我们的'],
  'Terms of Service':['Termos de Serviço','Términos del Servicio','服务条款'],
  'Privacy Policy':['Política de Privacidade','Política de Privacidad','隐私政策'],
  'Protected session':['Sessão protegida','Sesión protegida','受保护的会话'],
  'Local runtime encryption':['Criptografia do runtime local','Cifrado del runtime local','本地运行时加密']
});

Object.assign(entries,{
  'A cinematic product launch with clean camera motion, natural light and a vertical-safe composition.':['Um lançamento cinematográfico de produto com movimento de câmera limpo, luz natural e composição segura para vídeo vertical.','Un lanzamiento cinematográfico de producto con movimiento de cámara limpio, luz natural y composición segura para vídeo vertical.','电影感商品发布场景，镜头运动简洁、光线自然，并适配竖屏构图。'],'Prompt · 9:16 · 5 seconds':['Prompt · 9:16 · 5 segundos','Prompt · 9:16 · 5 segundos','提示词 · 9:16 · 5 秒']
});

Object.assign(entries,{
  'Language & region':['Idioma e região','Idioma y región','语言和地区'],
  'Region settings':['Configurações regionais','Configuración regional','地区设置'],
  'Currency':['Moeda','Moneda','货币'],
  'Manual selection':['Seleção manual','Selección manual','手动选择'],
  'Detected from your region':['Detectado pela sua região','Detectado según tu región','根据所在地区检测'],
});

Object.assign(entries,{
  'Studio':['Estúdio','Estudio','工作室'],'Production':['Produção','Producción','制作'],'Account':['Conta','Cuenta','账户'],'Shop LIVE':['LIVE Shop','LIVE Shop','商城直播'],'Game LIVE':['LIVE de games','LIVE de juegos','游戏直播'],'Creation studio':['Estúdio de criação','Estudio de creación','创作工作室'],'Subscription':['Assinatura','Suscripción','订阅'],
  'Choose how you want to create':['Escolha como você quer criar','Elige cómo quieres crear','选择您的创作方式'],'One workspace for commerce lives, interactive games and AI-assisted production.':['Um só espaço para lives de comércio, games interativos e produção com IA.','Un solo espacio para directos comerciales, juegos interactivos y producción con IA.','一个工作区，涵盖电商直播、互动游戏和 AI 辅助制作。'],'New production':['Nova produção','Nueva producción','新建制作'],'Commerce':['Comércio','Comercio','电商'],'Interactive':['Interativo','Interactivo','互动'],'Generative':['Generativo','Generativo','生成式'],'TikTok Shop LIVE':['TikTok Shop LIVE','TikTok Shop LIVE','TikTok Shop 直播'],'Products, pinned offers, comments and conversion automation in one control room.':['Produtos, ofertas fixadas, comentários e automação de conversão em uma central.','Productos, ofertas fijadas, comentarios y automatización de conversión en un panel.','在一个控制中心管理商品、置顶优惠、评论和转化自动化。'],'Shop adapter ready':['Adaptador da Shop pronto','Adaptador de Shop listo','商城适配器已就绪'],'Open Shop LIVE':['Abrir LIVE Shop','Abrir LIVE Shop','打开商城直播'],'Turn gifts, likes and chat messages into safe events inside the game.':['Transforme presentes, curtidas e mensagens em eventos seguros dentro do game.','Convierte regalos, me gusta y mensajes en eventos seguros dentro del juego.','将礼物、点赞和聊天消息转化为游戏内的安全事件。'],'Setup required':['Configuração necessária','Configuración necesaria','需要设置'],'Configure game LIVE':['Configurar LIVE de games','Configurar LIVE de juegos','配置游戏直播'],'Build reusable visual workflows for video, images and live assets.':['Crie fluxos visuais reutilizáveis para vídeo, imagens e materiais de live.','Crea flujos visuales reutilizables para vídeo, imágenes y recursos de directo.','为视频、图像和直播素材构建可复用的可视化工作流。'],'2 connectors to configure':['2 conectores para configurar','2 conectores por configurar','有 2 个连接器待配置'],'Open creation studio':['Abrir estúdio de criação','Abrir estudio de creación','打开创作工作室'],'Recent productions':['Produções recentes','Producciones recientes','最近制作'],'View all':['Ver tudo','Ver todo','查看全部'],'On air':['No ar','En directo','直播中'],'Draft':['Rascunho','Borrador','草稿'],'Edited 18 min ago':['Editado há 18 min','Editado hace 18 min','18 分钟前编辑'],'Workspace readiness':['Preparação do espaço','Preparación del espacio','工作区就绪状态'],'TikTok adapter connected':['Adaptador do TikTok conectado','Adaptador de TikTok conectado','TikTok 适配器已连接'],'Ready':['Pronto','Listo','已就绪'],'Game bridge':['Ponte do game','Puente del juego','游戏桥接'],'Choose a capture source':['Escolha uma fonte de captura','Elige una fuente de captura','选择采集源'],'Setup':['Configurar','Configurar','设置'],'AI models':['Modelos de IA','Modelos de IA','AI 模型'],'Add API credentials in Creation studio':['Adicione as credenciais de API no Estúdio de criação','Añade las credenciales de API en el Estudio de creación','在创作工作室中添加 API 凭据'],'Not connected':['Não conectado','No conectado','未连接'],
  'Interactive LIVE':['LIVE interativa','LIVE interactiva','互动直播'],'Game live studio':['Estúdio de live para games','Estudio de directos para juegos','游戏直播工作室'],'Map audience events to gameplay without exposing the game runtime directly.':['Mapeie eventos do público para o gameplay sem expor diretamente o runtime do game.','Asigna eventos de la audiencia al juego sin exponer directamente su entorno.','将观众事件映射到游戏玩法，而无需直接暴露游戏运行环境。'],'Test interactions':['Testar interações','Probar interacciones','测试互动'],'Prepare LIVE':['Preparar LIVE','Preparar LIVE','准备直播'],'Connect a game source':['Conecte uma fonte do game','Conecta una fuente del juego','连接游戏源'],'Select the game window or bridge before going live.':['Selecione a janela ou a ponte do game antes de entrar ao vivo.','Selecciona la ventana o el puente del juego antes de emitir.','开播前请选择游戏窗口或桥接。'],'Choose source':['Escolher fonte','Elegir fuente','选择来源'],'Interaction map':['Mapa de interações','Mapa de interacciones','互动映射'],'New interaction':['Nova interação','Nueva interacción','新建互动'],'Audience event':['Evento do público','Evento de audiencia','观众事件'],'Game action':['Ação no game','Acción del juego','游戏动作'],'Gift received':['Presente recebido','Regalo recibido','收到礼物'],'Spawn power-up':['Gerar power-up','Generar potenciador','生成增益道具'],'Comment: !boss':['Comentário: !boss','Comentario: !boss','评论：!boss'],'Start boss encounter':['Iniciar encontro com boss','Iniciar encuentro con jefe','开始首领战'],'5,000 likes':['5.000 curtidas','5.000 me gusta','5,000 次点赞'],'Unlock community shield':['Liberar escudo da comunidade','Desbloquear escudo de la comunidad','解锁社区护盾'],'Enabled':['Ativado','Activado','已启用'],'Live safety':['Segurança da live','Seguridad del directo','直播安全'],'Test mode':['Modo de teste','Modo de prueba','测试模式'],'Preview triggers without sending events to the game.':['Visualize os gatilhos sem enviar eventos ao game.','Previsualiza activadores sin enviar eventos al juego.','预览触发器而不向游戏发送事件。'],'Rate limits':['Limites de frequência','Límites de frecuencia','频率限制'],'Protect the game from event bursts and repeated commands.':['Proteja o game de picos de eventos e comandos repetidos.','Protege el juego de ráfagas de eventos y comandos repetidos.','保护游戏免受事件突发和重复命令影响。'],'Moderator approval':['Aprovação do moderador','Aprobación del moderador','版主审批'],'Hold high-impact actions for manual approval.':['Reter ações de alto impacto para aprovação manual.','Retén acciones de alto impacto para aprobación manual.','将高影响操作保留待手动审批。'],'Game runtime isolated':['Runtime do game isolado','Entorno del juego aislado','游戏运行环境已隔离'],'Only approved actions will cross the bridge.':['Somente ações aprovadas atravessarão a ponte.','Solo las acciones aprobadas cruzarán el puente.','只有获批操作可通过桥接。'],'Event monitor':['Monitor de eventos','Monitor de eventos','事件监视器'],'Waiting for source':['Aguardando fonte','Esperando fuente','等待来源'],'Interaction events will appear here':['Os eventos de interação aparecerão aqui','Los eventos de interacción aparecerán aquí','互动事件将显示在这里'],'Use test mode to validate the timing before the audience joins.':['Use o modo de teste para validar o tempo antes da entrada do público.','Usa el modo de prueba para validar los tiempos antes de que entre la audiencia.','在观众加入前使用测试模式验证时序。'],
  'Untitled video workflow':['Fluxo de vídeo sem título','Flujo de vídeo sin título','未命名视频工作流'],'Draft saved':['Rascunho salvo','Borrador guardado','草稿已保存'],'Run flow':['Executar fluxo','Ejecutar flujo','运行工作流'],'Starting flow…':['Iniciando fluxo…','Iniciando flujo…','正在启动工作流…'],'Nodes':['Nós','Nodos','节点'],'Search nodes':['Pesquisar nós','Buscar nodos','搜索节点'],'Prompt':['Prompt','Prompt','提示词'],'Text direction':['Direção de texto','Dirección de texto','文本指令'],'Video models':['Modelos de vídeo','Modelos de vídeo','视频模型'],'API connector':['Conector de API','Conector de API','API 连接器'],'Outputs':['Saídas','Salidas','输出'],'Live asset':['Material de live','Recurso de directo','直播素材'],'Preview & export':['Visualizar e exportar','Previsualizar y exportar','预览并导出'],'More connectors can be added later':['Mais conectores poderão ser adicionados depois','Se podrán añadir más conectores después','稍后可添加更多连接器'],'Visual creation workflow':['Fluxo visual de criação','Flujo visual de creación','可视化创作工作流'],'Campaign prompt':['Prompt da campanha','Prompt de la campaña','活动提示词'],'Text input':['Entrada de texto','Entrada de texto','文本输入'],'Video model':['Modelo de vídeo','Modelo de vídeo','视频模型'],'Multimodal model':['Modelo multimodal','Modelo multimodal','多模态模型'],'API not connected':['API não conectada','API no conectada','API 未连接'],'Waiting for a generation':['Aguardando uma geração','Esperando una generación','等待生成'],'Checking workflow connections…':['Verificando conexões do fluxo…','Comprobando conexiones del flujo…','正在检查工作流连接…'],'Properties':['Propriedades','Propiedades','属性'],'Write the creative direction shared by connected model nodes.':['Escreva a direção criativa compartilhada pelos nós de modelo conectados.','Escribe la dirección creativa compartida por los nodos de modelo conectados.','编写供已连接模型节点共享的创意指令。'],'API connector prepared for your future Seedance credentials.':['Conector de API preparado para suas futuras credenciais do Seedance.','Conector de API preparado para tus futuras credenciales de Seedance.','API 连接器已为您未来的 Seedance 凭据做好准备。'],'API connector prepared for your future Kling credentials.':['Conector de API preparado para suas futuras credenciais do Kling.','Conector de API preparado para tus futuras credenciales de Kling.','API 连接器已为您未来的 Kling 凭据做好准备。'],'Preview and export approved media to the production library.':['Visualize e exporte mídias aprovadas para a biblioteca de produção.','Previsualiza y exporta medios aprobados a la biblioteca de producción.','预览并将已批准媒体导出到制作库。'],'API connection':['Conexão de API','Conexión de API','API 连接'],'Not configured':['Não configurada','No configurada','未配置'],'Aspect ratio':['Proporção','Relación de aspecto','宽高比'],'Duration':['Duração','Duración','时长'],'Credentials stay protected':['As credenciais permanecem protegidas','Las credenciales permanecen protegidas','凭据始终受到保护'],'Connect the API when your provider access is ready.':['Conecte a API quando seu acesso ao provedor estiver pronto.','Conecta la API cuando esté listo tu acceso al proveedor.','提供商访问就绪后再连接 API。'],'No output yet':['Ainda não há saída','Aún no hay salida','尚无输出'],'Run a connected model to preview its result.':['Execute um modelo conectado para visualizar o resultado.','Ejecuta un modelo conectado para previsualizar el resultado.','运行已连接模型以预览结果。'],
  'Manage your workspace access, usage and future billing preferences.':['Gerencie o acesso, o uso e as futuras preferências de cobrança do espaço.','Gestiona el acceso, el uso y las futuras preferencias de facturación del espacio.','管理工作区访问、使用情况和未来账单偏好。'],'Change plan':['Alterar plano','Cambiar plan','更改方案'],'Current access':['Acesso atual','Acceso actual','当前访问'],'Early workspace':['Espaço inicial','Espacio inicial','早期工作区'],'Plan names and pricing will be configured later.':['Os nomes e preços dos planos serão configurados depois.','Los nombres y precios de los planes se configurarán después.','方案名称和价格将在稍后配置。'],'Current usage':['Uso atual','Uso actual','当前用量'],'Live production':['Produção de live','Producción en directo','直播制作'],'AI generation':['Geração por IA','Generación por IA','AI 生成'],'Workspace members':['Membros do espaço','Miembros del espacio','工作区成员'],'Billing details':['Dados de cobrança','Datos de facturación','账单详情'],'No payment method required':['Nenhuma forma de pagamento necessária','No se requiere método de pago','无需付款方式'],'Billing details can be added when plans are published.':['Os dados de cobrança poderão ser adicionados quando os planos forem publicados.','Los datos de facturación podrán añadirse cuando se publiquen los planes.','方案发布后可添加账单信息。'],'Add payment method':['Adicionar forma de pagamento','Añadir método de pago','添加付款方式'],'Plan management':['Gerenciamento do plano','Gestión del plan','方案管理'],'Plans coming soon':['Planos em breve','Planes próximamente','方案即将推出'],'This area is ready for tiers, limits and regional pricing.':['Esta área está pronta para níveis, limites e preços regionais.','Esta área está lista para niveles, límites y precios regionales.','此区域已为等级、限额和地区定价做好准备。']
});

Object.assign(entries,{
  'Launch video workflow':['Fluxo de vídeo de lançamento','Flujo de vídeo de lanzamiento','发布视频工作流'],'Saved':['Salvo','Guardado','已保存'],'Flow':['Fluxo','Flujo','流程'],'Tool':['Ferramenta','Herramienta','工具'],'Runs':['Execuções','Ejecuciones','运行记录'],'Share':['Compartilhar','Compartir','分享'],'Run workflow':['Executar fluxo','Ejecutar flujo','运行工作流'],'Running…':['Executando…','Ejecutando…','运行中…'],'Toggle node library':['Alternar biblioteca de nós','Alternar biblioteca de nodos','切换节点库'],'Assets':['Materiais','Recursos','素材'],'Creation settings':['Configurações de criação','Configuración de creación','创作设置'],'Add to canvas':['Adicionar ao canvas','Añadir al lienzo','添加到画布'],'Drag or click an item':['Arraste ou clique em um item','Arrastra o haz clic en un elemento','拖动或点击项目'],'Search models and tools':['Pesquisar modelos e ferramentas','Buscar modelos y herramientas','搜索模型和工具'],'Templates':['Modelos prontos','Plantillas','模板'],'ESSENTIALS':['ESSENCIAIS','ESENCIALES','基础'],'Write or combine text':['Escreva ou combine textos','Escribe o combina texto','编写或组合文本'],'Import media':['Importar mídia','Importar medios','导入媒体'],'Image, video or audio':['Imagem, vídeo ou áudio','Imagen, vídeo o audio','图像、视频或音频'],'VIDEO MODELS':['MODELOS DE VÍDEO','MODELOS DE VÍDEO','视频模型'],'Text and image to video':['Texto e imagem para vídeo','Texto e imagen a vídeo','文本和图像生成视频'],'Multimodal generation':['Geração multimodal','Generación multimodal','多模态生成'],'OUTPUT':['SAÍDA','SALIDA','输出'],'Preview':['Visualização','Vista previa','预览'],'Inspect generated media':['Inspecionar mídia gerada','Inspeccionar medios generados','检查生成媒体'],'Product motion':['Movimento de produto','Movimiento de producto','商品动态'],'Dual model compare':['Comparação de dois modelos','Comparación de dos modelos','双模型对比'],'Live scene pack':['Pacote de cenas para live','Paquete de escenas para directo','直播场景包'],'No saved nodes yet':['Ainda não há nós salvos','Aún no hay nodos guardados','尚无已保存节点'],'Save configured nodes or complete groups to reuse them here.':['Salve nós configurados ou grupos completos para reutilizá-los aqui.','Guarda nodos configurados o grupos completos para reutilizarlos aquí.','保存已配置节点或完整分组以便在此复用。'],'Campaign direction':['Direção da campanha','Dirección de campaña','活动方向'],'Text prompt':['Prompt de texto','Prompt de texto','文本提示词'],'Video generation':['Geração de vídeo','Generación de vídeo','视频生成'],'Input':['Entrada','Entrada','输入'],'Prompt + reference · 9:16':['Prompt + referência · 9:16','Prompt + referencia · 9:16','提示词 + 参考 · 9:16'],'Generated media appears here':['A mídia gerada aparece aqui','El contenido generado aparece aquí','生成的媒体将显示在这里'],'Add node':['Adicionar nó','Añadir nodo','添加节点'],'Find on canvas':['Localizar no canvas','Buscar en el lienzo','在画布中查找'],'Select':['Selecionar','Seleccionar','选择'],'Add prompt':['Adicionar prompt','Añadir prompt','添加提示词'],'Add note':['Adicionar nota','Añadir nota','添加便笺'],'Auto arrange':['Organizar automaticamente','Organizar automáticamente','自动排列'],'Validating workflow':['Validando fluxo','Validando flujo','正在验证工作流'],'Checking model connections and credentials…':['Verificando conexões e credenciais dos modelos…','Comprobando conexiones y credenciales de los modelos…','正在检查模型连接和凭据…'],'SELECTED NODE':['NÓ SELECIONADO','NODO SELECCIONADO','所选节点'],'Credentials are stored securely.':['As credenciais são armazenadas com segurança.','Las credenciales se almacenan de forma segura.','凭据将被安全存储。'],'Output quality':['Qualidade da saída','Calidad de salida','输出质量'],'Provider access required':['Acesso ao provedor necessário','Se requiere acceso al proveedor','需要提供商访问权限'],'Connect your API before running this node.':['Conecte sua API antes de executar este nó.','Conecta tu API antes de ejecutar este nodo.','运行此节点前请连接 API。'],'Connected models receive this text.':['Os modelos conectados recebem este texto.','Los modelos conectados reciben este texto.','已连接的模型将接收此文本。'],'No media generated':['Nenhuma mídia gerada','No se generó contenido','尚未生成媒体'],'Run a connected model to create a preview.':['Execute um modelo conectado para criar uma visualização.','Ejecuta un modelo conectado para crear una vista previa.','运行已连接模型以创建预览。']
});

Object.assign(entries,{
  'Launch video workflow':['Vídeo de lançamento','Vídeo de lanzamiento','发布视频'],
  'Sign out':['Sair','Cerrar sesión','退出登录'],
  'products':['produtos','productos','件商品'],
  'workflows':['fluxos','flujos','个工作流'],
  'No productions yet':['Nenhuma produção ainda','Aún no hay producciones','暂无制作'],
  'Create a live session or workflow to see it here.':['Crie uma sessão ao vivo ou um fluxo para vê-lo aqui.','Crea una sesión en vivo o un flujo para verlo aquí.','创建直播会话或工作流后将在此显示。'],
  'Workspace data':['Dados do workspace','Datos del espacio de trabajo','工作区数据'],
  'Stored in Supabase':['Armazenado na Supabase','Almacenado en Supabase','存储于 Supabase'],
  'Connected systems':['Sistemas conectados','Sistemas conectados','已连接系统']
});

const locales:Locale[]=localeOptions.map(option=>option.locale);
const textOriginals=new WeakMap<Text,string>();
const textRenderedValues=new WeakMap<Text,string>();
const attributeOriginals=new WeakMap<Element,Map<string,string>>();
const languageIndex:Record<'pt-BR'|'es'|'zh-CN',number>={'pt-BR':0,es:1,'zh-CN':2};
function translate(value:string,locale:Locale){
  if(locale==='en')return value;
  if(locale==='de-DE')return extraTranslations[value]?.[0]??value;
  if(locale==='ru-RU')return extraTranslations[value]?.[1]??value;
  return entries[value]?.[languageIndex[locale]]??value;
}
function translateNode(root:Node,locale:Locale,force=false){
  const visit=(node:Node)=>{
    if(node.nodeType===Node.TEXT_NODE){
      const textNode=node as Text;
      const current=textNode.nodeValue??'';
      if(!textOriginals.has(textNode)||(!force&&textRenderedValues.has(textNode)&&current!==textRenderedValues.get(textNode)))textOriginals.set(textNode,current);
      const base=textOriginals.get(textNode)??'';
      const trimmed=base.trim();
      const rendered=trimmed&&entries[trimmed]?base.replace(trimmed,translate(trimmed,locale)):base;
      textRenderedValues.set(textNode,rendered);
      if(current!==rendered)textNode.nodeValue=rendered;
      return
    }
    if(node.nodeType!==Node.ELEMENT_NODE&&node.nodeType!==Node.DOCUMENT_FRAGMENT_NODE)return;
    if(node.nodeType===Node.ELEMENT_NODE){const element=node as Element;for(const attr of ['placeholder','aria-label','title']){const value=element.getAttribute(attr);if(!value)continue;let map=attributeOriginals.get(element);if(!map){map=new Map;attributeOriginals.set(element,map)}if(!map.has(attr))map.set(attr,value);const base=map.get(attr)!;element.setAttribute(attr,translate(base,locale))}}
    node.childNodes.forEach(visit)
  };visit(root)
}

const currencyByRegion:Record<string,Currency>={US:'USD',BR:'BRL',DE:'EUR',ES:'EUR',PT:'EUR',FR:'EUR',IT:'EUR',NL:'EUR',AT:'EUR',BE:'EUR',IE:'EUR',FI:'EUR',GR:'EUR',CN:'CNY',RU:'RUB',GB:'GBP',CA:'CAD',AU:'AUD',MX:'MXN'};
const localeFromLanguage=(language:string):Locale=>{const normalized=language.toLowerCase();if(normalized.startsWith('pt'))return'pt-BR';if(normalized.startsWith('es'))return'es';if(normalized.startsWith('zh'))return'zh-CN';if(normalized.startsWith('de'))return'de-DE';if(normalized.startsWith('ru'))return'ru-RU';return'en'};
function detectedPreferences(){
  const language=navigator.languages?.[0]||navigator.language||'en-US';
  let region='US';try{region=new Intl.Locale(language).region||region}catch{/* use the safe default */}
  const locale=localeFromLanguage(language);
  return{locale,currency:currencyByRegion[region]??localeOptions.find(option=>option.locale===locale)?.currency??'USD'};
}

type I18nValue={locale:Locale;setLocale:(locale:Locale)=>void;currency:Currency;setCurrency:(currency:Currency)=>void;t:(value:string)=>string;formatCurrency:(value:number,options?:Intl.NumberFormatOptions)=>string};
const I18nContext=createContext<I18nValue|null>(null);
export function I18nProvider({children}:{children:ReactNode}){
  const detected=useMemo(detectedPreferences,[]);
  const [locale,setLocaleState]=useState<Locale>(()=>{
    const stored=localStorage.getItem('livefy-locale') as Locale|null;
    if(stored&&locales.includes(stored))return stored;
    return detected.locale;
  });
  const [currency,setCurrencyState]=useState<Currency>(()=>{const stored=localStorage.getItem('livefy-currency') as Currency|null;return stored&&currencyOptions.includes(stored)?stored:detected.currency});
  const setLocale=(next:Locale)=>{setLocaleState(next);const defaultCurrency=localeOptions.find(option=>option.locale===next)?.currency;if(defaultCurrency)setCurrencyState(defaultCurrency)};
  const setCurrency=(next:Currency)=>setCurrencyState(next);
  useEffect(()=>{localStorage.setItem('livefy-currency',currency);document.documentElement.dataset.currency=currency},[currency]);
  useEffect(()=>{localStorage.setItem('livefy-locale',locale);document.documentElement.lang=locale;translateNode(document.body,locale,true);const observer=new MutationObserver(records=>records.forEach(record=>{if(record.type==='characterData')translateNode(record.target,locale);else record.addedNodes.forEach(node=>translateNode(node,locale))}));observer.observe(document.body,{childList:true,characterData:true,subtree:true});return()=>observer.disconnect()},[locale]);
  const value=useMemo(()=>({locale,setLocale,currency,setCurrency,t:(source:string)=>translate(source,locale),formatCurrency:(amount:number,options?:Intl.NumberFormatOptions)=>new Intl.NumberFormat(locale==='en'?'en-US':locale,{style:'currency',currency,...options}).format(amount)}),[locale,currency]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
export function useI18n(){const value=useContext(I18nContext);if(!value)throw new Error('useI18n must be used inside I18nProvider');return value}
