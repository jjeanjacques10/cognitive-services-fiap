# Cognitive Services FIAP

Projeto para a palestra de Cognitive Services FIAP.

## Faculdade

[Faculdade de Informática e Administração Paulista - FIAP](https://www.fiap.com.br/)

## Tecnologias 

- ReactJS

## Configurar

Substitua o subscriptionKey e o endpointRegion dentro dos arquivos:

- src\components\FileAnalysis.js
- src\components\WebCamCV.js

```  
subscriptionKey: '',
endpointRegion: '',
```

Você pode entrar sua chave no [portal do Azure](https://portal.azure.com/) após criar um Costum Vision.

## Como executar o projeto

Para clonar e rodar a aplicar você precisa do [Git](https://git-scm.com), [Node.js v12.14.1][nodejs] ou uma versão mais nova instalada em seu computador. Siga os seguintes passos na linha de comando:

```bash
# Clona o repositório
$ git clone https://github.com/jjeanjacques10/cognitive-services-fiap.git


# Inicia o projeto (ReactJS)
$ cd cognitive-services-fiap
$ npm install
$ npm start
```


Projeto desenvolvido com base em [Azure-Samples](https://github.com/Azure-Samples/Cognitive-Services-Vision-Solution-Templates).

---
Developed by [Jean Jacques](https://github.com/jjeanjacques10) 