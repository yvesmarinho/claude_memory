---
tags: [projeto, desktop, monitoring, conky]
aliases: [conky, conky-config]
created: 2026-08-11
updated: 2026-08-11
---

> Ver histórico completo de sessões em [[../daily/2026-08-11|Daily 2026-08-11]].

# conky

- Monitor de sistema (widget de desktop) rodando na máquina desktop do usuário — exibe hostname, kernel, uptime, CPU/GPU, temperaturas, top processos, RAM/swap, uso de disco e IP.
- Config fonte versionada em: `/home/yves_marinho/Documentos/DevOps/conf/conky/conky.conf` (Lua, config nativa do Conky ≥1.10)
- Config ativa em produção: `/etc/conky/conky.conf` (requer sudo para gravar)
- Autostart: `~/.config/autostart/conky.desktop` → `conky --daemonize --pause=1`
- Máquina é **desktop** (sem bateria) — não incluir campos de bateria/ACPI na config.

## Comando de instalação/aplicação

```bash
sudo cp /home/yves_marinho/Documentos/DevOps/conf/conky/conky.conf /etc/conky/conky.conf \
  && killall conky && conky --daemonize --pause=1
```

Sempre executado pelo usuário via `! <comando>` no terminal — sudo interativo não funciona disparado pelo assistente.

## Campos de hardware exibidos (adicionados em 2026-08-11)

| Campo | Fonte | Motivo da escolha |
|---|---|---|
| CPU Model | `grep -m1 "model name" /proc/cpuinfo` | `lscpu` é locale-dependente (pt-BR: "Nome do modelo"); `/proc/cpuinfo` é sempre em inglês |
| GPU Model | `glxinfo \| awk -F': ' '/OpenGL renderer string/{print $2}'` | `lspci` só dá o nome do chip (genérico), não o fabricante da placa; `glxinfo` retorna string limpa (ex: `AMD Radeon RX 580 2048SP`) |
| Board (placa-mãe) | `/sys/devices/virtual/dmi/id/board_vendor` + `board_name` | Legível por usuário comum, sem sudo — ao contrário de `dmidecode` que falha sem root |

Todos usam `execi 86400` (dados estáticos de hardware, atualização 1x/dia é suficiente).

Hardware atual desta máquina (referência, pode mudar se trocar peças):
- CPU: AMD Ryzen 5 5600 6-Core Processor
- GPU: AMD Radeon RX 580 2048SP (Polaris 20 XL)
- Placa-mãe: Gigabyte Technology Co., Ltd. — B450M DS3H V2

## Histórico de bugs corrigidos

### Wrapper heredoc auto-instalável (removido)
O arquivo original começava com `sudo cat > /etc/conky/conky.conf <<EOF` e terminava com `EOF`, tentando ser um script que se auto-instala. Causou dois problemas:
1. Terminações de linha CRLF faziam o `EOF` final virar `EOF\r`, nunca reconhecido como delimitador do heredoc.
2. Mesmo corrigido, rodar via `sudo bash arquivo.conf` em ambiente não-interativo fazia o conteúdo da config ser interpretado linha a linha como comandos shell (`${color orange}` → erro "bad substitution").

**Decisão**: abandonar o padrão auto-instalável. O arquivo fonte agora é puro Lua/config do Conky, sem wrapper de shell. Instalação via `sudo cp` direto (ver comando acima).

### Interface de rede desatualizada
- A config antiga referenciava a interface `enp37s0` (inexistente nesta máquina); a interface real é **`enp5s0`** (IP local `192.168.15.117/24`). Linhas `IP`, `Up`, `Down` corrigidas para usar `enp5s0`.
- Se a placa de rede for trocada ou a máquina migrar, revalidar com `ip -o -4 addr show`.

### Erro "Can't get value of subfeature temp4_min: I/O error"
- Bug do driver `gigabyte_wmi` (placas Gigabyte) — expõe um subfeature de temperatura (`temp4_min`/`temp4_max`) não suportado pelo hardware; o comando `sensors` sempre imprime esse erro no stderr, mesmo com os dados válidos (`Tctl`, `edge`) saindo corretos.
- Fix: `2>/dev/null` adicionado nas duas chamadas de `sensors` (CPU Temp e GPU Temp).
- `CPU Temp` usa `Tctl` (temperatura do soquete/pacote via k10temp) — não é temperatura por núcleo; não precisa trocar de sensor.

### IP Externo saindo em IPv6
- `wget -q -O- http://ipecho.net/plain` retornava endereço IPv6 (a máquina tem rota IPv6 preferencial). Fix: `wget -4` para forçar IPv4.

### Cuidado: múltiplos processos conky simultâneos
- `killall conky` às vezes não mata todas as instâncias (observado 2 PIDs simultâneos, um com config antiga em memória, reproduzindo bugs já corrigidos no arquivo).
- Se um fix aplicado não aparecer, checar `pgrep -fa conky` e, se houver mais de um PID, usar `pkill -9 -x conky` antes de reiniciar.

## Campos de uso/status adicionados (2026-08-11, 2ª rodada)

| Campo | Fonte | Observação |
|---|---|---|
| CPU Uso % | `${cpu}` (builtin do Conky) | Uso agregado de todos os núcleos |
| GPU Uso % | `cat /sys/class/drm/card1/device/gpu_busy_percent` | Específico de GPU AMD (`amdgpu`); `card1` é o índice desta máquina — revalidar se hardware mudar (`ls /sys/class/drm/card*/device/gpu_busy_percent`) |
| Ollama (ativo/inativo) | `systemctl is-active ollama` (fallback `inativo` se o comando falhar) | Serviço systemd do Ollama já configurado nesta máquina |

- Removidas as linhas `Processes` (`${processes}`) e `Running` (`${running_processes}`) — não eram mais relevantes para o usuário.

## Ver também

- [[../memory/infra-stack|Infra Stack]]
- [[../daily/2026-08-11|Daily 2026-08-11]] — sessão em que os campos de hardware foram adicionados e o bug do heredoc foi corrigido
