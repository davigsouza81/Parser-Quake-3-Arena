var InitGame = 0; //Variavel que armazena o numero de partidas iniciadas

var gameData = new Object();//Objeto que armazena os dados gerados em todas as partidas

//'Classe' que define o objeto que armazena os dados de uma partida 
function Game() {
  this.total_kills = 0;
  this.players = [];
  this.kills = new Object();
  this.kills_by_means = new Object();
  
  this.addTotalKills = addTotalKills;
  this.getPlayers = getPlayers;
  this.setPlayers = setPlayers;
  this.setKills = setKills;
  this.addKills = addKills;
  this.removeKills = removeKills;
  this.addKillsByMeans = addKillsByMeans
  
  function addTotalKills(){
    this.total_kills++;
  }
  
  function getPlayers(){
    return this.players;
  }
  
  function setPlayers(player){
    this.players.push(player);
    this.players = Array.from(new Set(this.players));// Elimina players repetidos
  }
  
  function setKills(player){
    if(!this.kills.hasOwnProperty(player))//verifica se o player ja foi adicionado
      this.kills[player] = 0;
  }
  
  function addKills(player){
    this.kills[player]++;
  }
  
  function removeKills(player){
    this.kills[player]--;
  }
  
  function addKillsByMeans(mean){
    /*Verifica se o main ja foi adicionado. 
      #Se SIM conta quantas vezes foi utilizado. 
      #Se NAO adiciona o mean como uma nova propriedade do objeto
      */
    this.kills_by_means.hasOwnProperty(mean) ? this.kills_by_means[mean]++ : this.kills_by_means[mean] = 1;
  }
  
}

//Funcao que aguarda o upload do arquivo game.log
$("#selectFile").change(function(e) {
  onChange(e);
});

//Obtem o arquivo selecionado
function onChange(event) {
  var reader = new FileReader();
  reader.onload = onReaderLoad;
  reader.readAsText(event.target.files[0]);
}

//Manipula o arquivo
function onReaderLoad(event){
  //Quebra a string gerada com o conteudo do arquivo e armazena um vetor onde cada posicao corresponde a uma linha do arquivo
  var linhas = event.target.result.split(/\r?\n/);
  
  //Definicao das palavras chaves a serem encontradas no arquivo
  var keywords = new RegExp('InitGame|ShutdownGame|ClientUserinfoChanged|Kill');
  
  //Percorre linha a linha do arquivo e gera o relatorio
  linhas.forEach(function(linha){
    var currentGame = "game_"+InitGame;
    
    //Verifica se a linha lida contem uma das palavras chave
    if(keywords.test(linha)){
      
      //Elimina valores indesejaeis no inicio da linha
      linha = linha.replace(/\s{1,2}[0-9]{1,2}:[0-9]{2}\s/,"");
      
      /*
        #Sequancia de IF's que popula o objeto da classe Game de acordo com a palavra chave encontrada na linha
      */
      if(RegExp('InitGame').test(linha)){//Instancia um objeto Game a cada nova partida
        
        InitGame++;
        gameData["game_"+InitGame] = new Game();
        
      }
      else if(RegExp('ClientUserinfoChanged').test(linha)){//Adiciona as propriedades de cada jogador no objeto de Game
        
        var player = linha.split("\\",2).splice(1, 1)[0];
        gameData[currentGame].setPlayers(player);
        gameData[currentGame].setKills(player);
        
      } 
      else if(RegExp('Kill').test(linha)){//Comtabiliza as Kills ocorridas durante a partida
        
        gameData[currentGame].addTotalKills();
        var mean = linha.split("by ",2).splice(1, 1)[0];
        gameData[currentGame].addKillsByMeans(mean);
        
        //Contabiliza as kills de cada jogador
        var players = gameData[currentGame].getPlayers();
        players.forEach(function(player){
          if(RegExp(player+' killed').test(linha)) 
             gameData[currentGame].addKills(player);
          if(RegExp('<world>'+' killed '+player).test(linha))
             gameData[currentGame].removeKills(player);
        });
      }
    }
  })
  
  printReport();
}

//Gera o ranking geral de kills por jogador
function ranking(){
  var playersKills = new Object();
  var games = Object.keys(gameData);
  var ranking = [];
  
  //Percorre cada partida e contabiliza as kills de dada jogador
  games.forEach(function(game){
    gameData[game].players.forEach(function(player){
      
      //verifica se o jogador já está no ranking
      if(playersKills.hasOwnProperty(player))
        playersKills[player] +=  gameData[game].kills[player];
      else
        playersKills[player] =  gameData[game].kills[player];
    });
  })
  
  //Transforma o Objeto em um array
  for(var player in playersKills){
    ranking.push([player, playersKills[player]]);
  }
  
  //Ordena o rankng pela quantidade de kills de modo decrescente
  return ranking.sort(function(a, b) {
    return b[1] - a[1];
  });
}

//Imprime o relatório e o ranking
function printReport(){
  ranking().forEach(function(player){
    var htmlPlayer = "<li class='list-group-item d-flex justify-content-between align-items-center'>"
                        +player[0]
                        +"<span class='badge badge-primary badge-pill'>"+player[1]+"</span>"
                      +"</li>";
    $("#ranking").append(htmlPlayer);
  });
  
  var report = JSON.stringify({gameData}, null, '\t');
  $("#relatorio").replaceWith("<p class=\"card-text\" id=\"relatorio\"><pre>"+ report+"</pre></p>");
  $(".card").show(); 
}