'use strict';
/* 炫酷涂鸦 轻量版 —— 纯静态单页，无依赖 */

var HONORS = {'1z':0x1F000,'2z':0x1F001,'3z':0x1F002,'4z':0x1F003,'5z':0x1F006,'6z':0x1F005,'7z':0x1F004};
var SUITS  = {m:0x1F007, s:0x1F010, p:0x1F019};   /* 1m=U+1F007 … 9m=U+1F00F；1s=U+1F010；1p=U+1F019 */

var S = {all:[], meta:null, qs:[], i:0, score:0, picked:null, log:[], n:10};

/* ---------- 牌面 ---------- */
function face(raw){
  var c = String(raw).trim().replace(/^([mpsz])(\d)$/, '$2$1');  /* m1 -> 1m */
  var n = parseInt(c.charAt(0), 10), suit = c.charAt(1), red = (n === 0);
  if (HONORS.hasOwnProperty(c)) return {ch:String.fromCodePoint(HONORS[c]), red:false, label:c};
  var base = SUITS[suit];
  if (!base || isNaN(n) || n < 0 || n > 9) return {ch:c, red:false, label:c};
  return {ch:String.fromCodePoint(base + (red ? 4 : n - 1)), red:red, label:c};
}
function tileHTML(code, cls){
  var f = face(code);
  return '<span class="tile' + (f.red ? ' red' : '') + (cls ? ' ' + cls : '')
       + '" title="' + f.label + '">' + f.ch + '</span>';
}
/* 把解析文本里的 [[3m]] 渲染成小牌面 */
function explainHTML(text){
  var parts = String(text).split(/\[\[([^\]]+)\]\]/g), out = '';
  for (var i = 0; i < parts.length; i++){
    if (i % 2 === 1){
      var f = face(parts[i]);
      out += '<span class="mini' + (f.red ? ' red' : '') + '" title="' + f.label + '">' + f.ch + '</span>';
    } else {
      out += parts[i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\n/g,'<br>');
    }
  }
  return out;
}
/* ---------- 评级 ---------- */
function levelOf(rate){
  if (rate >= 1)    return {lv:'雀圣级', desc:'全程零失误。这种判断力，线下打牌记得给人留点面子。'};
  if (rate >= 0.9)  return {lv:'上级 · 天凤五段以上', desc:'牌效率理解扎实，几乎不浪费手牌。'};
  if (rate >= 0.8)  return {lv:'上级 · 天凤三段～四段', desc:'基础没问题，只在个别细节上有偏差。'};
  if (rate >= 0.7)  return {lv:'中级 · 天凤初段～二段', desc:'大方向对，取舍时容易高估或低估某张牌。'};
  if (rate >= 0.6)  return {lv:'中级 · 天凤一级～初段', desc:'能看出明显该切的牌，遇到"两张都不错"时会卡住。'};
  if (rate >= 0.45) return {lv:'下级 · 天凤三级～一级', desc:'牌效率的直觉有了，但搭子与打点的取舍还很粗。'};
  return {lv:'初心者', desc:'先熟悉役种、向听和搭子概念，再回来测一次会明显进步。'};
}
/* ---------- 视图 ---------- */
var screen = document.getElementById('screen');

function renderSetup(){
  var total = S.all.length;
  screen.innerHTML =
    '<div class="card"><h2>怎么玩</h2><ul>' +
      '<li>每题 13 张手牌 + 摸牌（最右一张），点你要切的牌。</li>' +
      '<li>点下去立刻判对错，并给出原题解析。</li>' +
      '<li>题库 ' + total + ' 题，每局随机抽题，结算按正确率给雀力评级。</li>' +
    '</ul></div>' +
    '<div class="modes">' +
      [10, 20].map(function(k){
        return '<button data-act="count" data-n="' + k + '"' + (S.n === k ? ' class="on"' : '') + '>每局 ' + k + ' 题</button>';
      }).join('') +
    '</div>' +
    '<button class="btn" data-act="start">开始测试</button>';
}
function startGame(){
  var pool = S.all.slice();
  for (var i = pool.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  S.qs = pool.slice(0, Math.min(S.n, pool.length));
  S.i = 0; S.score = 0; S.picked = null; S.log = [];
  renderQuestion();
}
function renderQuestion(){
  var q = S.qs[S.i], done = S.picked !== null, total = S.qs.length;
  var hand = q.hand.map(function(code, idx){
    var cls = '';
    if (done){
      if (code === q.answer) cls = ' ok';
      else if (idx === S.picked) cls = ' bad';
    }
    var f = face(code);
    return '<button class="tile pick' + (f.red ? ' red' : '') + cls + '" data-act="pick" data-i="' + idx + '"'
         + (done ? ' disabled' : '') + ' aria-label="打 ' + f.label + '" title="' + f.label + '">' + f.ch + '</button>';
  }).join('');
  var html = '<div class="rowtop"><span>第 ' + (S.i + 1) + ' / ' + total + ' 题</span><span>答对 ' + S.score + '</span></div>' +
    '<div class="bar"><i style="width:' + ((S.i + (done ? 1 : 0)) / total * 100) + '%"></i></div>' +
    '<div class="round">' + q.round + '</div>' +
    (q.dora ? '<div class="dora">宝牌指示牌 ' + tileHTML(q.dora) + '</div>' : '') +
    '<div class="hand">' + hand + '</div>';
  if (done){
    var right = q.hand[S.picked] === q.answer;
    html += '<div class="fb ' + (right ? 'good' : 'bad') + '">' +
      '<div class="ttl">' + (right ? '✓ 切对了' : '✗ 该打 ' + face(q.answer).label) + '</div>' +
      '<div class="txt">' + explainHTML(q.explain) + '</div></div>' +
      '<button class="btn" data-act="next">' + (S.i + 1 < total ? '下一题' : '看结果') + '</button>';
  }
  screen.innerHTML = html;
}
function pick(idx){
  if (S.picked !== null) return;
  var q = S.qs[S.i];
  S.picked = idx;
  var right = q.hand[idx] === q.answer;
  if (right) S.score++;
  S.log.push({no:S.i + 1, id:q.id, your:q.hand[idx], ans:q.answer, right:right, explain:q.explain});
  renderQuestion();
  var fb = screen.querySelector('.fb');
  if (fb) fb.scrollIntoView({block:'nearest', behavior:'smooth'});
}
function next(){
  if (S.i + 1 < S.qs.length){ S.i++; S.picked = null; renderQuestion(); }
  else renderResult();
}
function renderResult(){
  var total = S.qs.length, rate = S.score / total, lv = levelOf(rate);
  var wrongs = S.log.filter(function(r){ return !r.right; });
  var html = '<div class="res">' +
    '<div class="score">' + S.score + '/' + total + '</div>' +
    '<div class="pct">正确率 ' + Math.round(rate * 100) + '%</div>' +
    '<div class="lv">' + lv.lv + '</div>' +
    '<p class="desc">' + lv.desc + '</p>' +
    '<div class="grid">' + S.log.map(function(r){
      return '<i class="' + (r.right ? '' : 'x') + '">' + r.no + '</i>';
    }).join('') + '</div></div>' +
    '<button class="btn" data-act="again">再来一局</button>';
  if (wrongs.length){
    html += '<div class="card" style="margin-top:14px"><h2>错题速览</h2><div class="wrongs">' +
      wrongs.map(function(r){
        return '<div><span class="no">第' + r.no + '题</span>你切 ' + tileHTML(r.your) +
               ' → 正解 ' + tileHTML(r.ans) + '</div>';
      }).join('') + '</div></div>';
  }
  screen.innerHTML = html;
  window.scrollTo(0, 0);
}
/* ---------- 事件 ---------- */
document.body.addEventListener('click', function(ev){
  var el = ev.target.closest('[data-act]');
  if (!el) return;
  var act = el.dataset.act;
  if (act === 'count'){ S.n = parseInt(el.dataset.n, 10); renderSetup(); }
  else if (act === 'start') startGame();
  else if (act === 'pick')  pick(parseInt(el.dataset.i, 10));
  else if (act === 'next')  next();
  else if (act === 'again'){ S.qs = []; renderSetup(); }
});
/* ---------- 启动 ---------- */
fetch('questions.json', {cache:'no-store'})
  .then(function(r){ return r.json(); })
  .then(function(d){
    S.all = d.questions || [];
    S.meta = d.meta || {};
    if (!S.all.length) throw new Error('empty');
    renderSetup();
  })
  .catch(function(e){
    screen.innerHTML = '<p class="loading">题库加载失败：' + e.message + '</p>';
  });
