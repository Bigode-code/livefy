# Livefy Agent — auditoria e pontos de integração

Data da auditoria: 2026-08-18.

## Estado atual preservado

- O Control Plane já usa React, Supabase Auth, RLS, Storage, Realtime e Vercel.
- `media_items` é a fonte de verdade da playlist e o bucket privado `media` guarda os assets.
- `automation_rules` já persiste `trigger`, `conditions` e `actions` em JSON.
- `events` e `system_components` já são os destinos corretos para eventos e diagnósticos.
- O Broadcast Studio atual permanece como preview no navegador. Ele produz um `MediaStream` local, mas não é o runtime autoritativo da LIVE.
- A extensão Manifest V3 já faz pareamento, heartbeat, deduplicação, captura visível do TikTok e bloqueio por conta elegível.

## Limites encontrados

- Não existe aplicação Windows/Agent no repositório.
- Não existe protocolo Native Messaging.
- O clock atual pertence ao elemento de mídia do navegador e não pode dirigir automações de uma LIVE real.
- O executor de `automation_rules`, a fila de áudio reativo, cooldown e ducking ainda não existem.
- Os seletores do TikTok ainda estão concentrados em `extension/content.js`; precisam migrar para um adapter versionável antes de ações mutáveis.
- Não existe destino de câmera virtual nem saída de áudio virtual.

## Integrações que serão reutilizadas

| Necessidade | Implementação existente reutilizada |
| --- | --- |
| Identidade e autorização | Supabase Auth + workspace membership + RLS |
| Playlist | `media_items`, ordenada por `position` |
| Download do Agent | URL assinada temporária gerada pelo Control Plane |
| Regras | `automation_rules` |
| Comentários | `comments` e eventos capturados pela extensão |
| Telemetria | `events` e `system_components` |
| Preview | `src/broadcast/*` |
| Pareamento da extensão | `extension_devices` e device secret |

## Limite entre os planos

### Control Plane

Configura sessão, playlist, mídia, regras, produtos e comandos. Supabase transporta somente estado, comandos, eventos, métricas e configuração.

### Browser Bridge

Detecta TikTok, captura dados visíveis e troca mensagens JSON pequenas com o Agent. Frames, PCM e blobs contínuos ficam proibidos no Native Messaging.

### Data Plane

O Agent mantém clock autoritativo, cache, decoder, playlist, mixer e destinos locais. O navegador não fornece o `MediaStream` usado na LIVE real.

## Protocolo inicial

O host `com.livefy.agent` recebe envelopes JSON com `id`, `type` e `payload`. Cada resposta repete o `id`, informa `ok`, `type` e `payload` ou `error`. O transporte segue o framing Native Messaging: tamanho `uint32 little-endian` seguido do JSON UTF-8.

Comandos iniciais: `PING`, `GET_STATE`, `START`, `STOP`, `LOAD_SESSION`, `LOAD_MEDIA`, `LOAD_PLAYLIST`, `PLAY`, `PAUSE`, `SEEK`, `SET_VOLUME`, `PLAY_RESPONSE_AUDIO`, `STOP_RESPONSE_AUDIO` e `GET_DIAGNOSTICS`.

## Ferramentas nativas verificadas nesta máquina

- Node.js 22: disponível.
- FFmpeg/ffprobe 9.0.1: instalado localmente em `%LOCALAPPDATA%\Livefy\tools\ffmpeg` e validado por checksum.
- Visual C++ (`cl.exe`): não instalado ou não disponível no PATH.
- CMake: não instalado ou não disponível no PATH.
- MSBuild: não instalado ou não disponível no PATH.

Sem Windows SDK/Visual Studio Build Tools não é possível compilar e registrar uma câmera Media Foundation. O Agent deve falhar explicitamente nesse diagnóstico, nunca simular sucesso.

## Incremento implementado e verificado

- Processo TypeScript do Agent, protocolo versionado e framing Native Messaging.
- Clock monotônico autoritativo com tempo absoluto, posição dentro do loop e índice do loop.
- Inspeção real via FFprobe e decodificação local de vídeo/áudio via FFmpeg.
- Cliente Native Messaging da extensão com correlação, timeout, desconexão e reconexão periódica.
- Launcher Windows compilável pelo C# inbox e instalador do host Chrome por usuário.
- Diagnósticos mantêm `Livefy Camera` como `not_installed` e `Livefy Audio` como `not_configured`.

Testes executados no Windows:

- MP4 de um segundo com H.264/AAC decodificado continuamente por mais de dois loops.
- Launcher `.exe` recebeu um frame binário `PING` e devolveu `PONG` com o mesmo ID.
- Testes do Agent e da extensão, typecheck, lint e build de produção aprovados.

O bloqueio concreto restante para o POC de câmera é instalar um toolchain nativo Windows e implementar/registrar a câmera Media Foundation. Mesmo compilada, ela somente poderá ser chamada de funcional após ser enumerada e aberta pelo Chrome.

## Critério de honestidade

O runtime, protocolo e clock podem ser testados isoladamente. A câmera só será marcada como pronta depois de registrada no Windows, enumerada pelo Chrome e aberta via `getUserMedia()`. Até isso ocorrer, o diagnóstico deve permanecer `not_installed` ou `unavailable`.
