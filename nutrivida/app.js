/* NutriVida — versão simples, JavaScript puro */
(function () {
  'use strict';

  /* ===== CONFIGURAÇÃO: troque pelos dados reais do nutricionista ===== */
  var NUTRI = {
    name: 'Dr. Rodrigo Fontes',
    specialty: 'Nutrição clínica e esportiva',
    phone: '552433655739',             // só números, com 55 + DDD
    email: 'dr.rodrigofontes@gmail.com',
    photo: 'nutricionista.png'         // arquivo na mesma pasta do index.html
  };
  var ESCONDER_CONTATO_ATE_CONFIGURAR = true; // some com os botões enquanto o telefone for o de exemplo

  /* ===== Classificação do IMC ===== */
  var CATEGORIAS = [
    { max: 18.5, emoji: '🔵', label: 'Abaixo do peso', faixa: 'Menor que 18,5', ok: false,
      dica: 'Um IMC baixo pode ter várias causas. O nutricionista monta um plano para ganhar peso com saúde.' },
    { max: 25, emoji: '🟢', label: 'Peso normal', faixa: '18,5 a 24,9', ok: true,
      dica: 'Você está na faixa saudável. Continue com bons hábitos e registre seu peso todo mês.' },
    { max: 30, emoji: '🟡', label: 'Sobrepeso', faixa: '25,0 a 29,9', ok: false,
      dica: 'Mudanças graduais e orientadas funcionam melhor que dietas restritivas.' },
    { max: 35, emoji: '🟠', label: 'Obesidade grau I', faixa: '30,0 a 34,9', ok: false,
      dica: 'O ideal é um plano individual, com nutricionista e avaliação médica.' },
    { max: 40, emoji: '🔴', label: 'Obesidade grau II', faixa: '35,0 a 39,9', ok: false,
      dica: 'O ideal é um plano individual, com nutricionista e avaliação médica.' },
    { max: Infinity, emoji: '🔴', label: 'Obesidade grau III', faixa: '40,0 ou mais', ok: false,
      dica: 'O ideal é um plano individual, com nutricionista e avaliação médica.' }
  ];

  function classificar(imc) {
    return CATEGORIAS.filter(function (c) { return imc < c.max; })[0];
  }

  /* ===== Utilitários ===== */
  function $(s) { return document.querySelector(s); }
  function el(tag, attrs, html) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (html !== undefined) n.innerHTML = html;
    return n;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(n) { return n.toFixed(1).replace('.', ','); }
  function sinal(n) { return (n > 0 ? '+' : n < 0 ? '−' : '') + num(Math.abs(n)); }
  function data(iso) { var p = iso.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function mes(key) {
    var nomes = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    var p = key.split('-');
    return nomes[+p[1] - 1] + '/' + p[0];
  }
  function guardar(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { alert('Não foi possível salvar neste navegador.'); } }
  function ler(k, padrao) { try { var v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch (e) { return padrao; } }

  /* ===== Contas (simuladas no navegador) ===== */
  var usuario = null;
  var registros = [];

  function hash(texto) {
    if (window.crypto && crypto.subtle) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto)).then(function (b) {
        return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, '0'); }).join('');
      });
    }
    return Promise.resolve(btoa(unescape(encodeURIComponent(texto))));
  }
  
  function trocarAba(qual) {
    var login = qual === 'login';
    $('#form-entrar').hidden = !login;
    $('#form-cadastro').hidden = login;
    $('#aba-entrar').classList.toggle('ativa', login);
    $('#aba-cadastro').classList.toggle('ativa', !login);
  }

  function criarConta(e) {
    e.preventDefault();
    var nome = $('#cadastro-nome').value.trim();
    var email = $('#cadastro-email').value.trim().toLowerCase();
    var senha = $('#cadastro-senha').value;
    var erro = $('#cadastro-erro');
    var usuarios = ler('nv:users', []);

    if (nome.length < 2) { erro.textContent = 'Informe seu nome.'; return; }
    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(email)) { erro.textContent = 'Use um e-mail Gmail (@gmail.com).'; return; }
    if (senha.length < 6) { erro.textContent = 'A senha precisa ter pelo menos 6 caracteres.'; return; }
    if (usuarios.some(function (u) { return u.email === email; })) { erro.textContent = 'Este e-mail já tem conta. Use a aba Entrar.'; return; }

    var id = 'u' + Date.now();
    hash(id + ':' + senha).then(function (h) {
      var u = { id: id, nome: nome, email: email, senha: h };
      usuarios.push(u);
      guardar('nv:users', usuarios);
      e.target.reset();
      erro.textContent = '';
      entrar(u);
    });
  }

  function fazerLogin(e) {
    e.preventDefault();
    var email = $('#entrar-email').value.trim().toLowerCase();
    var senha = $('#entrar-senha').value;
    var u = ler('nv:users', []).filter(function (x) { return x.email === email; })[0];
    var erro = $('#entrar-erro');
    if (!u) { erro.textContent = 'E-mail ou senha incorretos.'; return; }
    hash(u.id + ':' + senha).then(function (h) {
      if (h !== u.senha) { erro.textContent = 'E-mail ou senha incorretos.'; return; }
      e.target.reset();
      erro.textContent = '';
      entrar(u);
    });
  }

  function entrar(u) {
    usuario = u;
    guardar('nv:session', u.id);
    registros = ler('nv:records:' + u.id, []);
    $('#tela-entrada').hidden = true;
    $('#tela-app').hidden = false;
    $('#caixa-usuario').hidden = false;
    $('#nome-usuario').textContent = u.nome.split(' ')[0];
    $('#nome-saudacao').textContent = u.nome.split(' ')[0];
    $('#imc-data').value = hoje();
    $('#imc-data').max = hoje();
    var ultimo = maisRecente();
    $('#imc-altura').value = ultimo ? ultimo.altura : '';
    $('#imc-idade').value = ultimo ? ultimo.idade : '';
    desenhar(ultimo);
    window.scrollTo(0, 0);
  }

  function sair() {
    localStorage.removeItem('nv:session');
    usuario = null;
    registros = [];
    $('#tela-app').hidden = true;
    $('#caixa-usuario').hidden = true;
    $('#tela-entrada').hidden = false;
    $('#area-resultado').innerHTML = '';
    trocarAba('login');
  }

  /* ===== Registros ===== */
  function ordenados() {
    return registros.slice().sort(function (a, b) {
      return a.data === b.data ? b.criado - a.criado : (a.data < b.data ? 1 : -1);
    });
  }
  function maisRecente() { return ordenados()[0] || null; }
  function salvar() { guardar('nv:records:' + usuario.id, registros); }

  function calcular(e) {
    e.preventDefault();
    var d = $('#imc-data').value;
    var peso = parseFloat($('#imc-peso').value.replace(',', '.'));
    var altura = parseFloat($('#imc-altura').value.replace(',', '.'));
    var idade = parseInt($('#imc-idade').value, 10);
    var erro = $('#imc-erro');

    if (!d || d > hoje()) { erro.textContent = 'Escolha uma data válida (não pode ser no futuro).'; return; }
    if (!(peso >= 20 && peso <= 400)) { erro.textContent = 'Informe um peso entre 20 e 400 kg.'; return; }
    if (!(altura >= 100 && altura <= 250)) { erro.textContent = 'Informe uma altura entre 100 e 250 cm.'; return; }
    if (!(idade >= 2 && idade <= 120)) { erro.textContent = 'Informe uma idade entre 2 e 120 anos.'; return; }
    erro.textContent = '';

    var m = altura / 100;
    var rec = {
      id: 'r' + Date.now(), data: d, peso: peso, altura: altura, idade: idade,
      imc: Math.round(peso / (m * m) * 10) / 10, criado: Date.now()
    };
    registros.push(rec);
    salvar();
    $('#imc-peso').value = '';
    desenhar(rec);
  }

  function excluir(id) {
    if (!confirm('Excluir este registro?')) return;
    registros = registros.filter(function (r) { return r.id !== id; });
    salvar();
    desenhar(maisRecente());
  }

  /* ===== Telas ===== */
  function desenhar(destaque) {
    desenharResultado(destaque);
    desenharHistorico();
    desenharEvolucao();
    desenharNutri();
  }

  function desenharResultado(r) {
    var box = $('#area-resultado');
    if (!r) { box.innerHTML = ''; return; }
    var c = classificar(r.imc);
    var m = r.altura / 100;
    var min = 18.5 * m * m, max = 24.9 * m * m;

    var comparacao;
    if (r.peso < min) comparacao = '⬇️ Abaixo da média: ' + num(min - r.peso) + ' kg abaixo da faixa saudável.';
    else if (r.peso > max) comparacao = '⬆️ Acima da média: ' + num(r.peso - max) + ' kg acima da faixa saudável.';
    else comparacao = '✅ Na média: seu peso está dentro da faixa saudável.';

    var aviso = '';
    if (r.idade < 18) aviso = '<p>⚠️ Para menores de 18 anos o IMC usa curvas de crescimento. Procure um pediatra ou nutricionista.</p>';
    else if (r.idade >= 60) aviso = '<p>⚠️ Para pessoas idosas as faixas do IMC são diferentes. Peça orientação profissional.</p>';

    box.innerHTML =
      '<div class="resultado">' +
        '<div class="resultado__emoji">' + c.emoji + '</div>' +
        '<div class="resultado__numero">' + num(r.imc) + '</div>' +
        '<div class="resultado__nome">' + c.label + '</div>' +
        '<p>' + comparacao + '</p>' +
        '<p>Faixa saudável para ' + num(r.altura) + ' cm: <strong>' + num(min) + ' a ' + num(max) + ' kg</strong></p>' +
      '</div>' +
      '<div class="indicacao"><p><strong>👨‍⚕️ Indicação para você</strong></p><p>' + c.dica + '</p>' + aviso + '</div>';
  }

  function desenharHistorico() {
    var lista = ordenados();
    var tbody = $('#historico-corpo');
    tbody.innerHTML = '';
    $('#historico-vazio').hidden = lista.length > 0;
    $('#historico-caixa').hidden = lista.length === 0;

    // Status de saúde
    var status = $('#area-situacao');
    if (!lista.length) { status.innerHTML = ''; }
    else {
      var c = classificar(lista[0].imc);
      var mesAtual = hoje().slice(0, 7);
      var feito = registros.some(function (r) { return r.data.slice(0, 7) === mesAtual; });
      status.innerHTML =
        '<div class="situacao"><p><strong>' + (c.ok ? '✅ Sua saúde está em dia' : '⚠️ Vale ficar de olho no IMC') + '</strong></p>' +
        '<p>Último registro: IMC ' + num(lista[0].imc) + ' (' + c.label + '). ' +
        (feito ? '📅 Registro deste mês: feito.' : '📅 Registro deste mês: pendente.') + '</p></div>';
    }

    lista.forEach(function (r) {
      var c = classificar(r.imc);
      var tr = el('tr', {}, '<td>' + data(r.data) + '</td><td>' + num(r.peso) + ' kg</td><td>' + num(r.imc) + '</td><td>' + c.emoji + ' ' + c.label + '</td>');
      var td = el('td');
      var b = el('button', { type: 'button', class: 'excluir', 'aria-label': 'Excluir', title: 'Excluir' }, '🗑️');
      b.addEventListener('click', function () { excluir(r.id); });
      td.appendChild(b);
      tr.appendChild(td);
      tbody.appendChild(tr);
    });
  }

  function desenharEvolucao() {
    // último registro de cada mês
    var porMes = {};
    registros.slice().sort(function (a, b) {
      return a.data === b.data ? a.criado - b.criado : (a.data < b.data ? -1 : 1);
    }).forEach(function (r) { porMes[r.data.slice(0, 7)] = r; });
    var meses = Object.keys(porMes).sort();

    var vazio = meses.length < 2;
    $('#evolucao-vazia').hidden = !vazio;
    $('#evolucao-total').hidden = vazio;
    var ul = $('#evolucao-lista');
    ul.innerHTML = '';
    if (vazio) return;

    var total = porMes[meses[meses.length - 1]].peso - porMes[meses[0]].peso;
    $('#evolucao-total').innerHTML = (total < 0 ? '📉' : total > 0 ? '📈' : '➖') + ' Total: <span class="' + (total < 0 ? 'perda' : total > 0 ? 'ganho' : '') + '">' + sinal(total) + ' kg</span> desde ' + mes(meses[0]);

    meses.forEach(function (k, i) {
      var r = porMes[k];
      var texto;
      if (i === 0) texto = '🏁 ponto de partida';
      else {
        var d = Math.round((r.peso - porMes[meses[i - 1]].peso) * 10) / 10;
        texto = d < 0 ? '📉 <span class="perda">' + sinal(d) + ' kg</span>'
              : d > 0 ? '📈 <span class="ganho">' + sinal(d) + ' kg</span>'
              : '➖ estável';
      }
      ul.appendChild(el('li', {}, '<span>' + mes(k) + ' · <strong>' + num(r.peso) + ' kg</strong></span><span>' + texto + '</span>'));
    });
  }

  function desenharNutri() {
    var card = $('#cartao-nutricionista');
    var configurado = NUTRI.phone !== '5511900000000' && NUTRI.email !== 'nutricionista@gmail.com';
    var ultimo = maisRecente();
    var msg = 'Olá, ' + NUTRI.name + '! Sou ' + usuario.nome + '.' +
      (ultimo ? ' Meu último IMC foi ' + num(ultimo.imc) + ' (' + classificar(ultimo.imc).label + ').' : '') +
      ' Gostaria de agendar uma consulta.';

    var foto = NUTRI.photo
      ? '<img class="nutricionista__foto" src="' + esc(NUTRI.photo) + '" alt="Foto de ' + esc(NUTRI.name) + '">'
      : '<div class="nutricionista__foto" aria-hidden="true">👨‍⚕️</div>';

    var botoes = '';
    if (configurado || !ESCONDER_CONTATO_ATE_CONFIGURAR) {
      botoes =
        '<div class="acoes">' +
          '<a class="botao" target="_blank" rel="noopener" href="https://wa.me/' + esc(NUTRI.phone) + '?text=' + encodeURIComponent(msg) + '">💬 WhatsApp</a>' +
          '<a class="botao botao--contorno" target="_blank" rel="noopener" href="https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(NUTRI.email) + '&su=' + encodeURIComponent('Agendamento de consulta') + '&body=' + encodeURIComponent(msg) + '">✉️ Gmail</a>' +
        '</div>';
    }

    card.innerHTML =
      '<div class="nutricionista">' + foto +
        '<div class="nutricionista__texto">' +
          '<h2>Nutricionista indicado</h2>' +
          '<p><strong>' + esc(NUTRI.name) + '</strong><br>' + esc(NUTRI.specialty) + '</p>' +
          botoes +
        '</div>' +
      '</div>';
  }

  function desenharTabelaIMC() {
    $('#tabela-imc').innerHTML = CATEGORIAS.map(function (c) {
      return '<tr><td>' + c.emoji + ' ' + c.label + '</td><td>' + c.faixa + '</td></tr>';
    }).join('');
  }

  /* ===== Início ===== */
  function iniciar() {
    desenharTabelaIMC();
    $('#aba-entrar').addEventListener('click', function () { trocarAba('login'); });
    $('#aba-cadastro').addEventListener('click', function () { trocarAba('register'); });
    $('#form-entrar').addEventListener('submit', fazerLogin);
    $('#form-cadastro').addEventListener('submit', criarConta);
    $('#form-imc').addEventListener('submit', calcular);
    $('#botao-sair').addEventListener('click', sair);

    var id = ler('nv:session', null);
    var u = id ? ler('nv:users', []).filter(function (x) { return x.id === id; })[0] : null;
    if (u) entrar(u);
  }

  iniciar();
})();
