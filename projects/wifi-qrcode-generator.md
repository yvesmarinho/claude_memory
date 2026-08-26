---
tags: [projeto, python, graphify]
aliases: [wifi-qrcode-generator]
created: 2026-08-04
updated: 2026-08-04
---

# wifi-qrcode-generator

- Localização: `/home/yves_marinho/Documentos/DevOps/Projetos/wifi-qrcode-generator`
- Gera QR Code para conexão Wi-Fi a partir de SSID/senha (script Python, biblioteca de QR code).
- Estrutura via graphify (teste de integração, 2026-08-04): 3 arquivos Python isolados (`wifi-qrcode-generator.py`, `_V01.py`, `_V02.py`), cada um com sua própria função `gerar_qrcode_wifi` — são versões duplicadas do mesmo script, não módulos separados; sem imports cruzados entre eles.
- Sem testes automatizados nem `graphify-out` versionado antes deste teste.

## Graphify
- Última extração: 2026-08-04 (`--code-only`, modo raso — 6 nodes, 3 edges, 3 comunidades).
- Sem god nodes nem conexões inferidas — corpus pequeno demais para sinal rico.
