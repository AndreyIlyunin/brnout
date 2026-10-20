// Превью портрета дизайнера — НЕ подключено к игре.
// Единственный референс: альт-девушка в косухе. Вектор-cel, без пиксельной сетки.
// Отличия от оригинала: бордовая косуха, тил-пряди, ухмылка, подвеска, свой принт.
window.PORTRAIT_V2 = {};

(function () {
  function dsn(C) {
    var W = 256, H = 208;
    var OUT = '#1c161e';
    var H0 = '#26222b', H1 = '#3a3441', H2 = '#514c5a', H3 = '#171320';
    var TE = '#47b8a4';
    var SK = '#eec9b6', SS = '#d19b88';
    var JK = '#3a1f26', JL = '#52303a', JH = '#6b4049';
    var TP = '#d8cfc2';
    var LIP = '#a34a52', LL = '#c25a64';

    function fillP(p, c) { C.fillStyle = c; C.fill(p); }
    function inkP(p, w) {
      C.lineJoin = 'round'; C.lineCap = 'round';
      C.strokeStyle = OUT; C.lineWidth = w; C.stroke(p);
    }

    // === фон ===
    C.fillStyle = '#c9b6b1';
    C.fillRect(0, 0, W, H);

    // === задняя копна ===
    var hair = new Path2D();
    hair.moveTo(128, 6);
    hair.bezierCurveTo(88, 4, 52, 20, 46, 56);
    hair.bezierCurveTo(42, 80, 42, 108, 48, 132);
    hair.bezierCurveTo(52, 150, 60, 162, 70, 170);
    hair.lineTo(186, 170);
    hair.bezierCurveTo(196, 162, 204, 150, 208, 132);
    hair.bezierCurveTo(214, 108, 214, 80, 210, 56);
    hair.bezierCurveTo(204, 20, 168, 4, 128, 6);
    hair.closePath();
    fillP(hair, H0);

    // шипы по силуэту
    [[88, 8, 80, -4], [110, 6, 106, -8], [146, 6, 142, -8], [166, 8, 176, -2],
     [46, 30, 30, 22], [43, 66, 26, 62], [45, 104, 30, 110], [52, 146, 40, 160],
     [210, 30, 226, 22], [213, 66, 230, 62], [211, 104, 226, 110], [204, 146, 216, 160]
    ].forEach(function (s) {
      var p = new Path2D();
      p.moveTo(s[0], s[1] + 9);
      p.lineTo(s[2], s[3]);
      p.lineTo(s[0] + 11, s[1] + 13);
      p.closePath();
      fillP(p, H0); inkP(p, 2.5);
    });

    // блики-полосы (cel)
    C.lineCap = 'round';
    C.strokeStyle = H2; C.lineWidth = 9;
    C.beginPath(); C.moveTo(78, 32); C.bezierCurveTo(96, 16, 120, 10, 142, 14); C.stroke();
    C.lineWidth = 5;
    C.beginPath(); C.moveTo(172, 26); C.bezierCurveTo(188, 36, 196, 50, 198, 66); C.stroke();
    C.strokeStyle = H1; C.lineWidth = 3;
    C.beginPath(); C.moveTo(60, 72); C.bezierCurveTo(58, 92, 60, 112, 66, 128); C.stroke();
    C.beginPath(); C.moveTo(196, 72); C.bezierCurveTo(198, 92, 196, 112, 190, 128); C.stroke();

    // тьма под подбородком (внутри копны)
    C.fillStyle = H3;
    C.beginPath(); C.ellipse(128, 138, 44, 18, 0, 0, Math.PI * 2); C.fill();

    // === шея ===
    fillP(new Path2D('M117,94 L139,94 L140,134 L116,134 Z'), SK);
    C.fillStyle = SS;
    C.fillRect(117, 94, 22, 8);
    C.fillRect(134, 94, 5, 26);

    // чокер + подвеска
    C.fillStyle = H3; C.fillRect(115, 112, 26, 6);
    C.strokeStyle = '#e2a84e'; C.lineWidth = 2;
    C.beginPath(); C.arc(128, 122, 3.5, 0, Math.PI * 2); C.stroke();

    // === косуха ===
    var jk = new Path2D('M30,208 L30,192 C30,160 58,142 96,134 L114,128 L142,128 L160,134 C198,142 226,160 226,192 L226,208 Z');
    fillP(jk, JK); inkP(jk, 3);

    // топ под косухой
    C.fillStyle = TP;
    C.fillRect(113, 166, 32, 42);
    fillP(new Path2D('M116,128 L140,128 L130,166 L126,166 Z'), TP);
    // принт
    C.fillStyle = TE; C.fillRect(120, 181, 9, 3);
    C.fillStyle = '#e56b8c'; C.beginPath(); C.arc(136, 188, 2.2, 0, Math.PI * 2); C.fill();
    C.fillStyle = '#e2c14e'; C.beginPath(); C.arc(124, 193, 2, 0, Math.PI * 2); C.fill();

    // лацканы
    fillP(new Path2D('M114,128 L100,148 L112,180 L126,166 Z'), JL); inkP(new Path2D('M114,128 L100,148 L112,180 L126,166 Z'), 2);
    fillP(new Path2D('M142,128 L156,148 L144,180 L130,166 Z'), JL); inkP(new Path2D('M142,128 L156,148 L144,180 L130,166 Z'), 2);

    // молния справа
    C.strokeStyle = '#7a6a70'; C.lineWidth = 2;
    C.beginPath(); C.moveTo(150, 150); C.lineTo(150, 206); C.stroke();
    C.fillStyle = '#9a8a90'; C.fillRect(148, 150, 4, 7);
    // швы
    C.strokeStyle = JH; C.lineWidth = 2;
    C.beginPath(); C.moveTo(60, 158); C.bezierCurveTo(70, 150, 80, 146, 92, 144); C.stroke();
    C.beginPath(); C.moveTo(196, 158); C.bezierCurveTo(186, 150, 176, 146, 164, 144); C.stroke();

    // боковые массы волос ПОВЕРХ плеч
    fillP(new Path2D('M60,120 C56,150 62,170 74,178 C80,166 78,140 76,120 Z'), H0);
    inkP(new Path2D('M60,120 C56,150 62,170 74,178 C80,166 78,140 76,120 Z'), 2);
    fillP(new Path2D('M196,120 C200,150 194,170 182,178 C176,166 178,140 180,120 Z'), H0);
    inkP(new Path2D('M196,120 C200,150 194,170 182,178 C176,166 178,140 180,120 Z'), 2);

    // === лицо ===
    var fc = new Path2D('M101,72 C101,50 114,41 128,41 C142,41 155,50 155,72 C155,91 143,106 128,107 C113,106 101,91 101,72 Z');
    fillP(fc, SK); inkP(fc, 2);
    // тени
    fillP(new Path2D('M149,56 C156,70 156,90 144,105 C151,90 151,70 144,58 Z'), SS);
    fillP(new Path2D('M104,46 C114,41 142,41 152,46 L152,53 C138,48 118,48 104,53 Z'), SS);
    // румянец
    C.fillStyle = 'rgba(229,163,151,0.8)';
    C.beginPath(); C.ellipse(112, 90, 6, 3.5, 0, 0, Math.PI * 2); C.fill();
    C.beginPath(); C.ellipse(144, 90, 6, 3.5, 0, 0, Math.PI * 2); C.fill();

    // брови
    C.strokeStyle = '#241a20'; C.lineWidth = 2.5; C.lineCap = 'round';
    C.beginPath(); C.moveTo(107, 69); C.bezierCurveTo(111, 66, 117, 65.5, 121, 67.5); C.stroke();
    C.beginPath(); C.moveTo(135, 65.5); C.bezierCurveTo(139, 64, 145, 64.5, 149, 67.5); C.stroke();

    // глаза
    [[115, 106], [141, 150]].forEach(function (e) {
      var cx = e[0];
      C.fillStyle = '#f6f1e6';
      C.beginPath(); C.ellipse(cx, 78, 6.5, 4.6, 0, 0, Math.PI * 2); C.fill();
      C.fillStyle = '#2e4a44';
      C.beginPath(); C.arc(cx + (cx < 128 ? 0.8 : -0.8), 78.6, 3.6, 0, Math.PI * 2); C.fill();
      C.fillStyle = '#101418';
      C.beginPath(); C.arc(cx + (cx < 128 ? 0.8 : -0.8), 78.6, 1.8, 0, Math.PI * 2); C.fill();
      C.fillStyle = '#fff';
      C.beginPath(); C.arc(cx - 1.4, 77, 1.3, 0, Math.PI * 2); C.fill();
      C.beginPath(); C.arc(cx + 2.2, 80.6, 0.7, 0, Math.PI * 2); C.fill();
      // верхнее веко с ресничкой
      C.strokeStyle = '#201418'; C.lineWidth = 2.8;
      C.beginPath();
      if (cx < 128) { C.moveTo(106, 74.8); C.lineTo(108.5, 76.5); C.bezierCurveTo(111, 73.2, 119, 72.8, 121.5, 76.3); }
      else { C.moveTo(150, 74.8); C.lineTo(147.5, 76.5); C.bezierCurveTo(145, 73.2, 137, 72.8, 134.5, 76.3); }
      C.stroke();
      // нижнее веко
      C.strokeStyle = 'rgba(209,155,136,0.9)'; C.lineWidth = 1.5;
      C.beginPath();
      if (cx < 128) { C.moveTo(110.5, 81.8); C.bezierCurveTo(113, 83.2, 118, 83.2, 120.5, 81.6); }
      else { C.moveTo(135.5, 81.6); C.bezierCurveTo(138, 83.2, 143, 83.2, 145.5, 81.8); }
      C.stroke();
    });

    // нос
    C.strokeStyle = 'rgba(209,155,136,0.95)'; C.lineWidth = 2;
    C.beginPath(); C.moveTo(128, 84); C.bezierCurveTo(127.4, 87, 127.2, 89.2, 128.6, 90.8); C.stroke();
    C.fillStyle = SS;
    C.beginPath(); C.arc(130.4, 91, 0.9, 0, Math.PI * 2); C.fill();

    // улыбка с приподнятым уголком
    C.strokeStyle = LIP; C.lineWidth = 2.6; C.lineCap = 'round';
    C.beginPath(); C.moveTo(117, 97); C.bezierCurveTo(122, 100.2, 130, 100.6, 135, 97.6);
    C.quadraticCurveTo(137.6, 96.2, 138.2, 93.6); C.stroke();
    C.strokeStyle = 'rgba(194,90,100,0.8)'; C.lineWidth = 1.5;
    C.beginPath(); C.moveTo(124, 102.8); C.bezierCurveTo(127, 103.8, 130, 103.8, 132.2, 102.6); C.stroke();

    // === чёлка + боковые пряди (поверх лица) ===
    var bn = new Path2D('M94,124 L96,58 C96,40 110,30 128,30 C146,30 160,40 160,58 L162,124 L155,120 L156,66 L151,73 L147,57 L141,69 L136,52 L133,66 L128,74 L123,57 L119,70 L114,55 L110,68 L106,54 L102,70 L98,84 Z');
    fillP(bn, H0); inkP(bn, 2.5);
    // пробор
    C.strokeStyle = H3; C.lineWidth = 2;
    C.beginPath(); C.moveTo(136, 52); C.lineTo(138, 34); C.stroke();
    // тил-прядь от пробора
    fillP(new Path2D('M137,52 C128,55 120,60 114,66 L116.5,69 C123,62 130,57 137,55 Z'), TE);
    // блики в чёлке
    C.strokeStyle = H2; C.lineWidth = 4;
    C.beginPath(); C.moveTo(100, 46); C.bezierCurveTo(110, 36, 124, 32, 136, 34); C.stroke();
    // тил-кончики боковых прядей
    fillP(new Path2D('M94,118 L98,116 L96,126 Z'), TE);
    fillP(new Path2D('M158,114 L154,112 L156,122 Z'), TE);
  }

  window.PORTRAIT_V2.dsn = dsn;
})();
