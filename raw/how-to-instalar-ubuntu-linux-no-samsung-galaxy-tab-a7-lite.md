# HOW-TO — Substituir One UI por e/OS no Samsung Galaxy Tab A7 Lite

> **Revisão:** agosto/2026 — Objetivo atualizado de Ubuntu Touch para e/OS A15 GSI,
> que é a alternativa estável disponível para SM-T220/SM-T225 em 2026.
> Ubuntu Touch permanece como caminho futuro (seção 31).

---

## 1. Objetivo

Este procedimento descreve como substituir o **One UI** do Samsung Galaxy Tab A7 Lite
por **e/OS (Android 15 AOSP)**, eliminando completamente a interface Samsung e
recuperando desempenho no hardware.

O procedimento contempla:

1. Identificação exata do modelo;
2. Backup completo em três níveis;
3. Desbloqueio do bootloader;
4. Instalação do TWRP via Heimdall (Linux);
5. Flash da e/OS A15 GSI;
6. Configuração pós-instalação (F-Droid, Fennec, Termux);
7. Estratégia de rollback para Android Samsung;
8. Caminho futuro para Ubuntu Touch nativo.

---

## 2. Por que e/OS e não Ubuntu Touch

```
Problema raiz: One UI 6.1 consome ~1,5 GB RAM em idle
               no hardware de 3 GB do SM-T220.

Solução correta: substituir o One UI por AOSP puro,
                 que consome ~600–700 MB em idle.
                 Ganho: ~800–900 MB de RAM liberados.
```

O **Ubuntu Touch** seria ideal, mas a situação em 2026 é:

```
Ubuntu Touch para SM-T220/SM-T225
        │
        ├── Port oficial UBports:    NÃO EXISTE
        │
        └── Port comunitário:        EM DESENVOLVIMENTO
                                     (Halium 12, experimental)
                                     áudio/suspend/câmera
                                     com bugs não resolvidos
```

O **e/OS** resolve o problema hoje:

```
e/OS A15 GSI para SM-T220/SM-T225
        │
        ├── Build ativo:             SIM (agosto 2025, v3.1.2)
        ├── Wi-Fi:                   OK
        ├── Áudio:                   OK
        ├── Bluetooth:               OK
        ├── Brilho automático:       OK
        ├── One UI:                  REMOVIDO
        ├── Google:                  REMOVIDO
        └── APK de loja:             DESNECESSÁRIO (F-Droid + browser)
```

---

## 3. Modelos abrangidos

```
SM-T220  — Wi-Fi
SM-T225  — 4G/LTE
SM-T225N — 4G/LTE (Coreia)
```

**Não utilize imagens destinadas ao SM-T500, SM-T505 ou SM-T507.**
Esses são o Galaxy Tab A7 10.4 — um tablet diferente.

---

## 4. AVISO — Variante SM-T227 (mercado americano)

O **SM-T227** é a variante americana (Verizon/AT&T).

```
SM-T227
   │
   └── Bootloader PERMANENTEMENTE BLOQUEADO
       OEM Unlock desabilitado pela operadora
       Não é possível desbloquear
```

Se o seu tablet for SM-T227, **este procedimento não se aplica**.
Verifique o modelo antes de prosseguir.

---

## 5. Identificar exatamente o tablet

No Android:

```
Configurações
    ↓
Sobre o tablet
```

Anote:

```
Nome do modelo:        Galaxy Tab A7 Lite
Número do modelo:      SM-T220   (ou SM-T225)
Versão do Android:     14
Versão da One UI:      6.1
Número da compilação:  UP1A.231005.007.T220XXSAEYE4
```

Via ADB, após habilitar depuração USB:

```bash
mkdir -p ~/samsung-a7-lite-backup/notes

{
    echo "===== MODEL ====="
    adb shell getprop ro.product.model

    echo "===== DEVICE ====="
    adb shell getprop ro.product.device

    echo "===== ANDROID ====="
    adb shell getprop ro.build.version.release

    echo "===== BUILD ====="
    adb shell getprop ro.build.display.id

    echo "===== CSC ====="
    adb shell getprop ro.boot.sales_code

    echo "===== SERIAL ====="
    adb get-serialno

    echo "===== VERIFIED BOOT ====="
    adb shell getprop ro.boot.verifiedbootstate

    echo "===== FLASH LOCK ====="
    adb shell getprop ro.boot.flash.locked

    echo "===== CARRIER ID ====="
    adb shell getprop ro.boot.carrierid

} | tee ~/samsung-a7-lite-backup/notes/device-information.txt
```

---

## 6. Preparar o computador Linux

No Debian/Ubuntu/Linux Mint:

```bash
sudo apt update

sudo apt install \
    adb \
    fastboot \
    heimdall-flash \
    usbutils \
    curl \
    wget \
    unzip \
    p7zip-full \
    tar \
    gzip
```

Verifique as versões:

```bash
adb version
fastboot --version
heimdall version
```

### Observação importante sobre Heimdall

O Heimdall dos repositórios Debian/Ubuntu pode estar desatualizado.
Se houver problemas de comunicação com o tablet, compile a versão mais
recente a partir do GitHub:

```bash
sudo apt install \
    build-essential \
    cmake \
    libusb-1.0-0-dev \
    zlib1g-dev \
    qt5-default 2>/dev/null || \
sudo apt install \
    build-essential \
    cmake \
    libusb-1.0-0-dev \
    zlib1g-dev \
    qtbase5-dev

git clone https://github.com/Benjamin-Dobell/Heimdall.git
cd Heimdall
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ..
make -j$(nproc)
sudo make install
```

### Regra udev para Samsung

Crie a regra udev para permitir acesso sem sudo:

```bash
cat <<'EOF' | sudo tee /etc/udev/rules.d/51-samsung.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
EOF

sudo udevadm control --reload-rules
sudo udevadm trigger

sudo usermod -aG plugdev $USER
```

Faça logout e login para aplicar o grupo.

---

## 7. Estratégia de backup em três níveis

```
Nível 1 — Dados pessoais
          Fotos, vídeos, documentos, downloads

Nível 2 — Configuração
          Lista de aplicativos, configurações, Smart Switch

Nível 3 — Firmware
          boot, system, vendor, vbmeta, dtbo, super
          → necessário para rollback de baixo nível
```

**Não pule nenhum nível.**

---

## 8. Backup via Samsung Smart Switch

O Smart Switch faz backup completo de nível 1 e 2 e é o método
mais seguro para restaurar dados após um eventual rollback.

```
Smart Switch só funciona em Windows ou macOS.
No Linux, utilize uma máquina virtual ou outro computador.
Não utilize Wine para operações de recuperação de firmware.
```

Fluxo:

```
Conectar tablet via USB
        ↓
Abrir Smart Switch
        ↓
Selecionar Backup
        ↓
Aguardar conclusão
        ↓
Salvar backup em local seguro
```

---

## 9. Backup ADB — arquivos pessoais

Habilite a depuração USB no tablet:

```
Configurações → Sobre o tablet → Número de compilação
(toque 7 vezes para habilitar Opções do desenvolvedor)

Configurações → Opções do desenvolvedor → Depuração USB → Ativar
```

Conecte via USB e aceite o prompt no tablet:

```bash
adb devices
```

Saída esperada:

```
List of devices attached
R9PTB1LGJNX    device
```

Se aparecer `unauthorized`, olhe o tablet e autorize o computador.

Copie os arquivos pessoais:

```bash
mkdir -p ~/samsung-a7-lite-backup/files

adb pull /sdcard/DCIM      ~/samsung-a7-lite-backup/files/
adb pull /sdcard/Pictures  ~/samsung-a7-lite-backup/files/
adb pull /sdcard/Documents ~/samsung-a7-lite-backup/files/
adb pull /sdcard/Download  ~/samsung-a7-lite-backup/files/
adb pull /sdcard/WhatsApp  ~/samsung-a7-lite-backup/files/ 2>/dev/null || true
```

Verifique o espaço:

```bash
du -sh ~/samsung-a7-lite-backup/
```

---

## 10. Backup do armazenamento interno completo

Verifique o espaço disponível antes:

```bash
adb shell df -h /sdcard
df -h ~
```

Se houver espaço suficiente:

```bash
adb pull /sdcard ~/samsung-a7-lite-backup/internal-storage/
```

---

## 11. Backup do cartão microSD

Se o tablet possui microSD, desmonte-o corretamente no Android
antes de retirar.

No Linux, identifique o dispositivo:

```bash
lsblk
```

Faça a imagem — **substitua `/dev/sdX` pelo dispositivo correto**:

```bash
sudo dd \
    if=/dev/sdX \
    of=~/samsung-a7-lite-backup/microsd.img \
    bs=4M \
    status=progress \
    conv=fsync
```

**Confirme o dispositivo antes de executar. Um erro aqui pode
destruir o disco do computador.**

---

## 12. Verificar integridade do backup

```bash
cd ~/samsung-a7-lite-backup

find . -type f -exec sha256sum {} \; \
    > checksums/SHA256SUMS

sha256sum -c checksums/SHA256SUMS
```

Todos os arquivos devem retornar `OK`.

---

## 13. Backup da configuração do Android

```bash
mkdir -p ~/samsung-a7-lite-backup/adb

adb shell getprop \
    > ~/samsung-a7-lite-backup/adb/device-properties.txt

adb shell settings list system \
    > ~/samsung-a7-lite-backup/adb/settings-system.txt

adb shell settings list secure \
    > ~/samsung-a7-lite-backup/adb/settings-secure.txt

adb shell settings list global \
    > ~/samsung-a7-lite-backup/adb/settings-global.txt

adb shell pm list packages -f \
    > ~/samsung-a7-lite-backup/adb/installed-packages.txt
```

---

## 14. Guardar o firmware original Samsung

O firmware oficial é necessário para rollback de baixo nível.

**Fontes confiáveis para download do firmware Samsung:**

- [SamFW — firmware oficial Samsung](https://samfw.com/)
- [SamMobile](https://www.sammobile.com/samsung/galaxy-tab-a7-lite/firmware/)

Baixe o firmware correspondente ao:

```
Modelo:  SM-T220  (ou SM-T225)
CSC:     seu código de região (ex.: ZTO para Brasil)
```

O CSC do seu tablet está em:

```bash
adb shell getprop ro.boot.sales_code
```

Salve o arquivo de firmware em:

```bash
mkdir -p ~/samsung-a7-lite-backup/firmware
```

---

## 15. Registrar inventário completo do dispositivo

```bash
{
    echo "===== INVENTÁRIO DO DISPOSITIVO ====="
    echo "Data: $(date)"
    echo ""

    echo "--- Modelo ---"
    adb shell getprop ro.product.model

    echo "--- Device ---"
    adb shell getprop ro.product.device

    echo "--- Android ---"
    adb shell getprop ro.build.version.release

    echo "--- Build ---"
    adb shell getprop ro.build.display.id

    echo "--- CSC ---"
    adb shell getprop ro.boot.sales_code

    echo "--- Carrier ID ---"
    adb shell getprop ro.boot.carrierid

    echo "--- Serial ---"
    adb get-serialno

    echo "--- Verified Boot ---"
    adb shell getprop ro.boot.verifiedbootstate

    echo "--- Flash Lock ---"
    adb shell getprop ro.boot.flash.locked

    echo "--- Armazenamento ---"
    adb shell df -h

} | tee ~/samsung-a7-lite-backup/notes/inventory-$(date +%Y%m%d).txt
```

---

## 16. Baixar artefatos necessários

Antes de qualquer modificação no tablet, baixe e prepare:

### TWRP para SM-T220/SM-T225

Fonte oficial: [https://twrp.me/samsung/samsunggalaxytaba7lite.html](https://twrp.me/samsung/samsunggalaxytaba7lite.html)

Alternativamente, o thread XDA mantém builds atualizadas:

```
XDA: TWRP for Samsung Galaxy A7 Lite SM-T220 SM-T225 SM-T227
https://xdaforums.com/t/twrp-for-samsung-galaxy-a7-lite-sm-t220-sm-t225-sm-t227.4467157/
```

Salve o arquivo TWRP:

```bash
mkdir -p ~/samsung-a7-lite-backup/tools
# ex.: twrp-3.x.x-sm-t220.img
mv ~/Downloads/twrp*.img \
    ~/samsung-a7-lite-backup/tools/twrp-sm-t220.img
```

### e/OS A15 GSI para SM-T220/SM-T225

Thread XDA com builds ativas (versão agosto 2025, v3.1.2):

```
XDA: e/OS A15 GSI for SM-T225/220
https://xdaforums.com/t/2025-aug-full-customizes-e-os-a15-microg-gapps-special-for-sm-t225.4753892/
```

Verifique o thread para a versão mais recente disponível.
Baixe o arquivo GSI (`system.img` ou `.zip`):

```bash
mkdir -p ~/samsung-a7-lite-backup/gsi
mv ~/Downloads/eos*.img \
    ~/samsung-a7-lite-backup/gsi/eos-a15-sm-t220.img
```

Calcule o hash do GSI baixado e compare com o fornecido no thread:

```bash
sha256sum ~/samsung-a7-lite-backup/gsi/eos-a15-sm-t220.img
```

---

## 17. Habilitar OEM Unlock

No tablet:

```
Configurações
    ↓
Sobre o tablet
    ↓
Informações do software
    ↓
Número de compilação
```

Toque **sete vezes** em `Número de compilação`.
Isso habilita as **Opções do desenvolvedor**.

```
Configurações
    ↓
Opções do desenvolvedor
    ↓
Desbloqueio de OEM  → ATIVAR
```

Se a opção `Desbloqueio de OEM` estiver cinza ou ausente:
- O aparelho pode ser uma variante bloqueada pela operadora (SM-T227);
- O aparelho pode precisar de conexão com conta Samsung antes de liberar.

> **Não prossiga se OEM Unlock não puder ser habilitado.**

---

## 18. Download Mode — procedimento correto para SM-T220/T225

O SM-T220/T225 usa o mecanismo proprietário Samsung (Download Mode),
**não o fastboot padrão do Android**.

### Método para entrar no Download Mode:

```
1. Desligue o tablet completamente

2. Pressione e segure:
       Volume Down + Power

3. Quando o Samsung logo aparecer, conecte o cabo USB ao computador

4. Solte os botões

5. Tela de aviso do Download Mode aparece

6. Pressione Volume Up para CONFIRMAR e entrar no Download Mode
```

**O passo 6 (Volume Up para confirmar) é obrigatório.**
Sem ele, o tablet não entra no modo de gravação.

Método alternativo (funciona em algumas revisões de firmware):

```
1. Desligue o tablet completamente

2. Conecte o cabo USB ao computador enquanto segura
   Volume Up + Volume Down simultaneamente

3. Quando a tela de aviso aparecer, pressione Volume Up para confirmar
```

### Para sair do Download Mode:

```
Segure Power + Volume Down até a tela apagar
```

---

## 19. Desbloquear o bootloader

> **ATENÇÃO: O desbloqueio causa factory reset automático.**
> Todos os dados do tablet serão apagados.
> Confirme que o backup está concluído antes de prosseguir.

Checklist antes do desbloqueio:

```
✓ Smart Switch backup concluído
✓ Fotos, documentos e downloads copiados
✓ Lista de aplicativos salva
✓ Firmware Samsung baixado
✓ TWRP baixado e verificado
✓ e/OS GSI baixado e verificado
✓ Inventário do dispositivo salvo
✓ CSC e build registrados
```

### Procedimento de desbloqueio:

Entre no Download Mode conforme seção 18.

Na tela do Download Mode, **pressione e segure Volume Up por 3 segundos**.

Uma tela de confirmação aparece com aviso em vermelho.

**Pressione Volume Up novamente para confirmar o desbloqueio.**

O tablet realiza factory reset e reinicia automaticamente com
o bootloader desbloqueado.

### Verificar o desbloqueio:

Após o tablet reiniciar no Android (tela de configuração inicial):

```
1. Passe pela configuração inicial minimamente
   (pode ignorar conta Google)

2. Habilite Developer Options novamente
   (Configurações → Sobre → Número de compilação × 7)

3. Habilite USB Debugging
   (Configurações → Opções do desenvolvedor)

4. Conecte ao computador e verifique:
```

```bash
adb shell getprop ro.boot.verifiedbootstate
# esperado: orange  (bootloader desbloqueado)

adb shell getprop ro.boot.flash.locked
# esperado: 0
```

---

## 20. Instalar TWRP via Heimdall

Com o tablet em Android normal (após reboot pós-desbloqueio):

Verifique que o Heimdall detecta o tablet em Download Mode.

Entre no Download Mode (seção 18):

```bash
heimdall detect
```

Saída esperada:

```
Device detected
```

Se `heimdall detect` retornar erro de permissão:

```bash
sudo heimdall detect
# ou verifique se a regra udev da seção 6 foi aplicada
```

### Flash do TWRP:

```bash
heimdall flash \
    --RECOVERY ~/samsung-a7-lite-backup/tools/twrp-sm-t220.img \
    --no-reboot
```

> **CRÍTICO:** Assim que o Heimdall terminar, imediatamente segure
> `Volume Up + Power` para iniciar direto no TWRP.
> Se o tablet iniciar o Android normalmente antes, ele sobrescreve
> o TWRP com o recovery original Samsung.

---

## 21. Iniciar o TWRP

Para entrar no TWRP após o flash:

```
Tablet desligado
    ↓
Segure Volume Up + Power
    ↓
Quando o logo Samsung aparecer, mantenha Volume Up pressionado
    ↓
TWRP deve iniciar
```

Se o TWRP pedir para alterar o sistema:

```
Selecionar: Keep Read Only
(para não modificar o sistema antes do flash do GSI)
```

Confirme que o TWRP está funcionando:
- A tela de toque deve responder;
- O menu principal do TWRP deve aparecer.

---

## 22. Flash da e/OS A15 GSI via TWRP

### Passo 1 — Limpar as partições

No TWRP:

```
Wipe
    ↓
Advanced Wipe
    ↓
Selecionar: System, Data, Cache, Dalvik / ART Cache
    ↓
Swipe to Wipe
```

### Passo 2 — Transferir o GSI para o tablet

Com o tablet em TWRP (modo MTP ou ADB):

```bash
# Via ADB sideload (método mais confiável):
# No TWRP: Advanced → ADB Sideload → Swipe to Start Sideload

adb sideload ~/samsung-a7-lite-backup/gsi/eos-a15-sm-t220.img
```

Ou transfira o arquivo via MTP e instale pelo gerenciador de arquivos
do TWRP:

```bash
# Ativar MTP no TWRP: Mount → Enable MTP
# Copiar o arquivo e instalar por Install → selecionar o arquivo
```

### Passo 3 — Flash do GSI

```
Install
    ↓
Selecionar o arquivo eos-a15-sm-t220.img (ou .zip)
    ↓
Swipe to confirm flash
```

Aguarde a conclusão. O processo pode levar 5–15 minutos.

### Passo 4 — Limpar cache pós-instalação

```
Wipe
    ↓
Wipe Cache / Dalvik
    ↓
Swipe to Wipe
```

### Passo 5 — Reiniciar

```
Reboot
    ↓
System
```

O primeiro boot do e/OS pode demorar 3–5 minutos. É normal.

---

## 23. Primeira inicialização e configuração mínima

Ao iniciar o e/OS pela primeira vez:

```
Assistente de configuração inicial
    ↓
Pular conta Murena/e/OS (opcional — não obrigatório)
    ↓
Configurar Wi-Fi
    ↓
Pular Google Account (e/OS não usa Google)
    ↓
Configuração mínima concluída
```

### Verificar o build instalado:

```
Configurações
    ↓
Sobre o telefone
    ↓
Versão do Android: 15
    ↓
e/OS version: 3.x
```

---

## 24. Instalar F-Droid

O **F-Droid** é o repositório de aplicativos open source.
É a única loja de apps necessária para este perfil de uso.

Baixe o APK diretamente do site oficial:

```
https://f-droid.org/F-Droid.apk
```

No browser padrão do e/OS, acesse a URL acima e instale.
O e/OS já vem com a opção de instalar APKs de fontes externas
disponível no browser.

Após instalar o F-Droid, **não instale outros APKs de fontes aleatórias**.
O F-Droid audita e compila todo o código que distribui.

---

## 25. Instalar Fennec (browser principal)

O **Fennec F-Droid** é o Firefox sem telemetria Mozilla,
distribuído pelo F-Droid. É o browser recomendado para este perfil.

No F-Droid:

```
F-Droid
    ↓
Buscar: Fennec
    ↓
Instalar: Fennec F-Droid
```

Por que Fennec e não Mull:
- Mull aplica anti-fingerprinting que degrada desempenho em hardware modesto;
- Fennec oferece melhor performance de scroll e vídeo no Helio G80;
- Para uso web puro (web apps, SSH via browser, dashboards), Fennec é mais fluido.

Configure o Fennec:

```
about:config
    ↓
gfx.webrender.all = true        (ativa WebRender para melhor performance)
browser.sessionstore.interval = 60000  (reduz I/O)
```

---

## 26. Instalar Termux via F-Droid

> **ATENÇÃO: Não instale o Termux pelo Google Play Store.**
> A versão da Play Store está oficialmente descontinuada desde 2020
> e não recebe atualizações de segurança.
> A versão correta é exclusivamente pelo **F-Droid** ou
> pelo **GitHub Releases** do projeto.

No F-Droid:

```
F-Droid
    ↓
Buscar: Termux
    ↓
Instalar: Termux (by Fredrik Fornwall)
```

Após instalar:

```bash
pkg update && pkg upgrade

pkg install \
    openssh \
    git \
    vim \
    python \
    curl \
    wget \
    tmux \
    jq \
    rsync \
    iproute2 \
    net-tools
```

Agora o tablet funciona como terminal SSH para administração
da sua infraestrutura:

```bash
ssh usuario@servidor
```

---

## 27. Verificar funcionamento completo

Execute os testes após a instalação:

### Rede:

```bash
# No Termux:
ip addr
ip route
ping -c 4 1.1.1.1
ping -c 4 google.com
```

### SSH:

```bash
ssh -v usuario@servidor-de-teste
```

### Browser (web apps):

Acesse via Fennec:

```
Grafana:    http://seu-servidor:3000
Airflow:    http://seu-servidor:8080
Chatwoot:   https://seu-chatwoot
N8N:        https://seu-n8n
```

### Python:

```bash
# No Termux:
python --version
python -c 'print("e/OS funcionando")'
```

### Git:

```bash
git --version
git clone https://github.com/seu-usuario/repo-teste.git /tmp/teste
```

---

## 28. O que NÃO fazer

```
✗ Não use o Termux da Google Play Store
✗ Não instale APKs de sites desconhecidos
✗ Não use imagens GSI do SM-T500 no SM-T220
✗ Não faça cross-flashing entre variantes (T220 ≠ T225 ≠ T227)
✗ Não bloqueie o bootloader novamente com o e/OS instalado
  (o tablet pode tornar-se inutilizável)
✗ Não execute fastboot flash com imagens de outros modelos
```

---

## 29. Rollback — recuperação para Android Samsung original

Se o e/OS não atender ou houver problemas, o caminho de recuperação é:

```
Download Mode (seção 18)
        ↓
Firmware oficial Samsung (baixado na seção 14)
        ↓
Flash via Odin (Windows) ou Heimdall (Linux)
        ↓
Android Samsung restaurado
```

### Flash do firmware via Heimdall (Linux):

O firmware Samsung vem em arquivos `.tar` ou `.tar.md5`.
Extraia e identifique as partições:

```bash
tar xf SM-T220_*.tar.md5 -C ~/samsung-a7-lite-backup/firmware/extracted/
ls ~/samsung-a7-lite-backup/firmware/extracted/
```

As partições típicas são:

```
AP_*.tar  → system, boot, recovery, vendor
BL_*.tar  → bootloader
CP_*.tar  → modem/baseband
CSC_*.tar → região/CSC
```

Flash via Heimdall (entre no Download Mode antes):

```bash
# Identifique os arquivos de cada partição e ajuste conforme necessário
heimdall flash \
    --BOOTLOADER bl.bin \
    --BOOT boot.img \
    --RECOVERY recovery.img \
    --SYSTEM system.img \
    --VENDOR vendor.img
```

> **Para o rollback completo do firmware Samsung, o método mais seguro
> e confiável é o Odin no Windows.** O Heimdall pode ter limitações
> com alguns formatos de partição Samsung. Se o rollback for crítico,
> utilize o Odin em uma máquina virtual Windows.

---

## 30. Estrutura de backup recomendada

```bash
mkdir -p ~/samsung-a7-lite-backup/{
    adb,
    android/SmartSwitch,
    android/files,
    android/internal-storage,
    firmware/extracted,
    gsi,
    tools,
    checksums,
    notes
}
```

```
samsung-a7-lite-backup/
├── adb/
│   ├── boot-properties.txt
│   ├── device-properties.txt
│   ├── installed-packages.txt
│   ├── settings-global.txt
│   ├── settings-secure.txt
│   └── settings-system.txt
│
├── android/
│   ├── SmartSwitch/          ← backup Smart Switch
│   ├── files/                ← DCIM, Pictures, Documents, Download
│   └── internal-storage/     ← cópia completa do /sdcard
│
├── firmware/
│   ├── SM-T220-original.tar.md5
│   └── extracted/
│
├── gsi/
│   └── eos-a15-sm-t220.img   ← GSI a instalar
│
├── tools/
│   └── twrp-sm-t220.img      ← TWRP recovery
│
├── checksums/
│   └── SHA256SUMS
│
└── notes/
    ├── device-information.txt
    └── inventory-YYYYMMDD.txt
```

---

## 31. Caminho futuro — Ubuntu Touch nativo

Se futuramente o port do Ubuntu Touch para SM-T220/T225 estabilizar,
a migração do e/OS para Ubuntu Touch usa o mesmo TWRP instalado.

Acompanhe o desenvolvimento em:

```
UBports Forum:
https://forums.ubports.com/topic/10669/can-i-install-ubuntu-touch-on-my-tablet-galaxy-tab-a7-lite-sm-t225

XDA — Looking for tester Ubuntu touch:
https://xdaforums.com/t/looking-for-tester-ubuntu-touch.4781598/
```

Status atual (agosto 2026):

```
Port:         Halium 12, em desenvolvimento
Wi-Fi:        parcialmente funcional
Áudio:        com bugs
Suspend:      com problemas
Câmera:       não funcional
Browser:      Morph (funcional quando o port inicializa)
Indicação:    NÃO adequado para uso diário
```

Quando o port atingir estabilidade de daily driver, o procedimento
de instalação será equivalente ao do e/OS (seções 21–22), apenas
substituindo o arquivo GSI.

---

## 32. Resumo do processo completo

```
FASE 1 — Preparação (sem risco ao tablet)
  ├── Identificar SM-T220/T225/T225N
  ├── Preparar computador Linux (Heimdall, ADB)
  ├── Backup Smart Switch (Windows/VM)
  ├── Backup ADB (arquivos pessoais)
  ├── Backup armazenamento interno
  ├── Guardar firmware Samsung oficial
  ├── Baixar TWRP para SM-T220
  ├── Baixar e/OS A15 GSI
  └── Verificar hashes de tudo

FASE 2 — Instalação (irreversível sem rollback)
  ├── Habilitar OEM Unlock
  ├── Download Mode → desbloquear bootloader (factory reset)
  ├── Reinstalar ADB/Developer Options no Android limpo
  ├── Download Mode → Heimdall flash TWRP
  ├── Boot no TWRP
  ├── Wipe: System + Data + Cache + Dalvik
  ├── ADB sideload: e/OS A15 GSI
  ├── Wipe Cache pós-instalação
  └── Reboot

FASE 3 — Configuração (sem risco)
  ├── Configuração inicial mínima (sem conta Google)
  ├── Instalar F-Droid (APK oficial)
  ├── Instalar Fennec F-Droid (browser)
  ├── Instalar Termux via F-Droid (terminal)
  └── Verificar: SSH, rede, web apps
```
