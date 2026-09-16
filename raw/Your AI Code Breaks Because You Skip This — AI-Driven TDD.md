
O vídeo intitulado **"Your AI Code Breaks Because You Skip This — AI-Driven TDD"** do canal _Geekific_ aborda como transformar o uso de Inteligência Artificial no desenvolvimento de software, aplicando os conceitos de **Desenvolvimento Orientado a Testes (TDD)** para gerar códigos mais resilientes e seguros ([1:23](https://www.youtube.com/watch?v=clUR-k-tQIg&t=83s)).

Abaixo está a transcrição estruturada e traduzida dos principais pontos e explicações apresentados no conteúdo do vídeo:

---

🧠 O Grande Problema: Testes de "Caminho Feliz" (Happy Path)

A maioria dos desenvolvedores não gosta de escrever testes; eles são vistos como os "vegetais" do mundo da engenharia de software — sabemos que fazem bem, mas criá-los parece um castigo ([0:06](https://www.youtube.com/watch?v=clUR-k-tQIg&t=6s)).

Por conta disso, o erro mais comum é criar apenas testes de **Happy Path** (caminho feliz) ([0:31](https://www.youtube.com/watch?v=clUR-k-tQIg&t=31s)). Esses testes assumem um cenário perfeito onde ([0:38](https://www.youtube.com/watch?v=clUR-k-tQIg&t=38s)):

- O usuário sempre digita um e-mail válido.
- O banco de dados nunca fica fora do ar.
- O gateway de pagamento nunca sofre um _timeout_ (tempo limite esgotado).

Quando você pede para uma IA criar uma função diretamente (como processar um pagamento), ela compartilha desse mesmo otimismo ([0:51](https://www.youtube.com/watch?v=clUR-k-tQIg&t=51s)). O código funcionará perfeitamente até que alguém envie um valor negativo, um payload nulo ou a API falhe, fazendo a aplicação explodir em produção com erros como `NullPointerException` ([0:57](https://www.youtube.com/watch?v=clUR-k-tQIg&t=57s)).

🛠️ Invertendo o Fluxo com IA-Driven TDD

A solução proposta é **mudar completamente o fluxo de trabalho**: usar a IA primeiro como engenheira de qualidade (QA) para definir contratos, validações e testes antes de escrever qualquer linha de código de lógica de negócios ([1:10](https://www.youtube.com/watch?v=clUR-k-tQIg&t=70s)).

O método baseia-se em uma estrutura de **Prontuário Estrutural (Structural Prompting)** dividida em passos ([1:45](https://www.youtube.com/watch?v=clUR-k-tQIg&t=105s)):

1. Definindo o Contrato (DTO-First)

Em vez de pedir de forma genérica "Crie uma classe de usuário", você deve definir o papel da IA e o contexto rigoroso ([1:23](https://www.youtube.com/watch?v=clUR-k-tQIg&t=83s)). No exemplo do vídeo, cria-se um serviço de transação financeira onde a consistência de dados é crítica ([1:52](https://www.youtube.com/watch?v=clUR-k-tQIg&t=112s)).

- **Ação:** Pedir à IA para criar DTOs de requisição e resposta (_OrderRequest_ e _OrderResponse_) usando **Java Records** ([2:00](https://www.youtube.com/watch?v=clUR-k-tQIg&t=120s)).
- **Restrições:** Aplicar anotações de validação estritas (o valor deve ser positivo, o código da moeda deve ter exatamente três letras e o ID do usuário não pode ser nulo) ([2:10](https://www.youtube.com/watch?v=clUR-k-tQIg&t=130s)). Isso força a IA a entender o que são dados válidos antes mesmo de processá-los ([2:19](https://www.youtube.com/watch?v=clUR-k-tQIg&t=139s)).

2. Criando Exceções Semânticas

Se você deixar a IA gerenciar erros por conta própria, ela usará exceções genéricas de tempo de execução (_runtime exceptions_) ([2:32](https://www.youtube.com/watch?v=clUR-k-tQIg&t=152s)). Para evitar logs inúteis que não explicam se o erro foi de validação ou de rede, o fluxo exige que você defina exceções semânticas customizadas, como `InvalidOrderException` e `PaymentGatewayException` ([2:45](https://www.youtube.com/watch?v=clUR-k-tQIg&t=165s)).

3. Escrevendo a Suíte de Testes Primeiro (Fase Vermelha / Red Phase)

Antes de pedir a implementação do serviço, você instrui a IA a agir como um engenheiro de QA focado apenas em cenários de falha e casos limite (_edge cases_) ([3:07](https://www.youtube.com/watch?v=clUR-k-tQIg&t=187s)).

- A IA gerará uma suíte de testes impiedosa usando **JUnit 5**, simulando falhas de banco de dados, injeções de valores nulos e testando se as exceções customizadas corretas são lançadas ([3:13](https://www.youtube.com/watch?v=clUR-k-tQIg&t=193s)).
- Como o serviço real ainda não foi construído, os testes vão falhar (o que caracteriza a fase vermelha do TDD) ([3:47](https://www.youtube.com/watch?v=clUR-k-tQIg&t=227s)).

4. Implementando a Lógica para Passar nos Testes (Fase Verde / Green Phase)

Com a suíte de testes pronta, você fornece todo o contexto anterior e pede para a IA: _"Escreva a implementação do serviço para passar nesses testes específicos"_ ([3:54](https://www.youtube.com/watch?v=clUR-k-tQIg&t=234s)).

O código gerado nessa etapa é fundamentalmente diferente do tradicional ([4:00](https://www.youtube.com/watch?v=clUR-k-tQIg&t=240s)):

- Ele valida nulos imediatamente porque o teste exige ([4:06](https://www.youtube.com/watch?v=clUR-k-tQIg&t=246s)).
- Ele envolve chamadas de banco de dados em blocos `try-catch` porque o teste simulou _timeouts_ ([4:06](https://www.youtube.com/watch?v=clUR-k-tQIg&t=246s)).
- Torna-se um código puramente defensivo e altamente resiliente ([4:00](https://www.youtube.com/watch?v=clUR-k-tQIg&t=240s)).

🎯 Conclusão: O Humano como Arquiteto

A Inteligência Artificial funciona como um "Yes Man" (alguém que apenas diz sim) ([4:28](https://www.youtube.com/watch?v=clUR-k-tQIg&t=268s)). Se você não pedir testes ou validações, ela assumirá que o mundo é perfeito ([4:28](https://www.youtube.com/watch?v=clUR-k-tQIg&t=268s)).

O papel indispensável do desenvolvedor humano é ser o **arquiteto que define as restrições** e assume o ceticismo em relação aos dados e à rede, enquanto a IA atua puramente como o construtor que executa o trabalho pesado ([4:33](https://www.youtube.com/watch?v=clUR-k-tQIg&t=273s)).

---