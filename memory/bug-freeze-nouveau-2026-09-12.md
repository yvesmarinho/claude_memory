---
tags: [memory, infra, bug, gpu, nouveau, home016]
aliases: [freeze nouveau, travamento home016, bug GPU 12-09-2026]
created: 2026-09-12
updated: 2026-09-12
---

<!-- Modificado em: 12/09/2026 13:39 -->

# BUG: Congelamento total do desktop (mouse/teclado travados) — home016 — 12/09/2026

Relacionado: [[infra-stack]]

## Sintoma relatado pelo usuário

Sessão anterior travou por completo: mouse e teclado pararam de responder,
sem nenhuma reação da interface. Foi necessário reiniciar a máquina na marra
(hard reset / botão físico) — não houve desligamento gracioso.

## Máquina

- Host: `home016`
- Kernel: `6.8.0-139-generic` (Ubuntu, `#139-Ubuntu SMP PREEMPT_DYNAMIC Sat Aug 1 03:52:05 UTC 2026`)
- GPU: NVIDIA GeForce GT 740 (GK107), mas no momento do crash rodando com o driver livre **`nouveau`** (não o proprietário),
  apesar de a cmdline do kernel conter `nvidia_drm.modeset=1`
  (`BOOT_IMAGE=/boot/vmlinuz-6.8.0-139-generic ... nvidia_drm.modeset=1`) —
  ou seja, o parâmetro estava presente mas quem estava de fato ativo era o `nouveau`.
- Compositor: Xorg + Cinnamon (`cinnamon-session-binary`).

## Linha do tempo (evidências extraídas de `/var/log/kern.log`, `/var/log/syslog`, `/var/log/Xorg.0.log.old`, `journalctl`, `last reboot`)

Sessão analisada: boot `2026-09-12T13:02:49-03:00` → hard reset em `2026-09-12T13:15:27-03:00`.

1. **13:08:46** — `nouveau 0000:07:00.0` começa a disparar dezenas de `TRAP` na
   engine gráfica: `gr: GPC0/PROP trap: 00000020 [RT_HEIGHT_OVERRUN]`, em
   múltiplos canais (`ch 8`, `ch 9`), todos atribuídos ao processo
   `gst-plugin-scan[17052]` (processo do GStreamer usado para probe/scan de
   codecs — tipicamente disparado por thumbnailer de vídeo do gerenciador de
   arquivos ou app de mídia abrindo/pré-visualizando um vídeo).
2. **13:08:52 → 13:14:19** (**~5min27s**) — **silêncio total nos logs do
   sistema** (kernel, syslog, auth) — nenhuma linha registrada em nenhum log.
   Isso corresponde exatamente ao congelamento relatado: o travamento não foi
   só da UI, foi do sistema inteiro (kernel/GPU bloqueados).
3. **13:14:19** — `nouveau` reporta falha fatal de página na engine gráfica,
   no canal usado pelo Xorg:
   ```
   nouveau 0000:07:00.0: fifo: fault 00 [READ] at 0000000002d30000 engine 00 [GR] client 08 [GPC0/PE_2] reason 02 [PTE] on channel 2 [00ff890000 Xorg[5349]]
   nouveau 0000:07:00.0: fifo:000000:0002:[Xorg[5349]] rc scheduled
   nouveau 0000:07:00.0: fifo:000000:0002:0002:[Xorg[5349]] errored - disabling channel
   nouveau 0000:07:00.0: Xorg[5349]: channel 2 killed!
   ```
4. `/var/log/Xorg.0.log.old` confirma o efeito colateral: o próprio Xorg
   sofreu **segfault (sinal 11)** dentro da pilha Mesa/gallium, no caminho de
   `glamor`/VDPAU (`glamor_destroy_pixmap` → `vdp_imp_device_create_x11` →
   `libgallium-25.2.8-0ubuntu0.24.04.2.so`), com "Fatal server error: Caught
   signal 11 (Segmentation fault). Server aborting" — coerente com o canal
   de GPU do X ter sido morto pelo kernel.
5. Não há nenhum log de shutdown limpo (nenhum "Shutting down" / "Reached
   target Shutdown" / `systemd-shutdown`) entre o crash e o próximo boot
   (`2026-09-12T13:15:32`, `Linux version 6.8.0-139-generic...`) — confirma
   que o usuário precisou fazer **hard reset** (botão físico), pois o sistema
   não respondia mais.

## Causa raiz

Hang do driver gráfico open-source **`nouveau`**, disparado por uma operação
de renderização/decodificação de vídeo do GStreamer (`gst-plugin-scan`) que
gerou overrun no render target (`RT_HEIGHT_OVERRUN`) repetidamente na engine
GR da GPU, evoluindo ~5 minutos depois para um **page fault fatal** que
travou o canal gráfico usado pelo Xorg — congelando o desktop inteiro (mouse
e teclado inclusos, pois a engine de input também fica bloqueada quando o
compositor trava esperando a GPU). O X não conseguiu se recuperar
graciosamente do canal morto e sofreu segfault na pilha Mesa/glamor/VDPAU.

## Mitigação — aplicada e validada em 12/09/2026 13:39

1. **Driver trocado para o proprietário NVIDIA** — validado após o reboot via
   `lspci -k` (`Kernel driver in use: nvidia`), `lsmod` (`nvidia`, `nvidia_drm`,
   `nvidia_modeset`, `nvidia_uvm` carregados, **nenhum** módulo `nouveau` em uso)
   e `nvidia-smi` (GPU `GeForce GT 740` respondendo normalmente, driver ativo).
   `nvidia_drm.modeset=1` continua na cmdline, agora efetivamente honrado pelo
   driver correto. Isso deve eliminar este tipo de hang, já que o `nouveau`
   tem suporte limitado a reset de GPU em travamentos de engine gráfica.
2. Investigar/desabilitar o thumbnailer de vídeo do gerenciador de arquivos
   (o que dispara `gst-plugin-scan`) segue como mitigação complementar, ainda
   não verificada — vale considerar mesmo com o driver NVIDIA ativo, como
   camada extra de segurança.

## Comandos úteis para diagnóstico futuro

- Ver janela de log de uma sessão anterior por boot:
  `grep -n "device-mapper: core" /var/log/kern.log` (marca o início de cada
  boot, já que essa linha aparece uma vez por boot logo no início).
- Buscar gaps de silêncio total nos logs (indício de freeze de kernel):
  comparar timestamps consecutivos em `/var/log/kern.log`/`/var/log/syslog`.
- Erros de GPU nouveau: `grep -i "nouveau" /var/log/kern.log`.
- Confirmar se houve shutdown limpo antes de um boot: procurar por
  "Reached target Shutdown"/"systemd-shutdown" entre o fim de uma sessão e o
  próximo boot — ausência = hard reset/crash.
- Validar driver ativo: `lspci -k | grep -A3 -i vga` (linha `Kernel driver in
  use`), `lsmod | grep -E 'nouveau|nvidia'`, `nvidia-smi -L`.
