d3.json("json/kurashiki.geojson", function(kurashiki) {
  d3.json('json/iryou.geojson', function(iryou){
    draw(kurashiki, iryou);
  });
});


function draw(kurashiki,iryou){
  var geodata = kurashiki.features;	//前橋町境地理データ
  var pointdata = iryou.features;	//避難所ポイントデータ
  var positions = [];
  var  colorGen= function(){ 	//カラージェネレーター
    return '#'+Math.floor(Math.random()*16777215).toString(16);
  }

  //ツールチップ要素追加
  var tooltip = d3.select("body")
  .append("div")
  .attr("class", "tooltip")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")

  var h = 1000;
  var w = 1000;


  var svg = d3.select("body").append("svg")
  .attr({
    "width": w,
    "height": h
  })

  var mask = svg.append("defs").append("mask").attr("id", "mask").append("g");

  //プロジェクション設定
  var mercator = d3.geo.mercator()
  .center([133.746748, 34.556963])
  .translate([w/2, h/2])
  .scale(200000);

  //geoパスジェネレーター生成
  var path = d3.geo.path().projection(mercator);　

  //cellを表示するグループを作成
  var cellgroup = svg.append("svg:g").attr("id", "cells");


  pointdata.forEach(function(d) {
    var xy = mercator(d.geometry.coordinates);
    positions.push({x:xy[0], y:xy[1], targetClass:".cell"+d.properties["P04_002"], properties:d.properties}); //位置情報→ピクセル
  });

  //ボロノイ変換関数
  var voronoi = d3.geom.voronoi()
  .x(function(d){ return d.x })
  .y(function(d){ return d.y });

  var polygons = voronoi(positions);

  //境界要素追加
  var cell = svg.selectAll(".voronoi")
  .data(pointdata)
  .enter()
  .append("svg:path")
  .attr({
    "class":function(d, i){return "voronoi cell" + d.properties["P04_002"]},
    "d":function(d, i) {if(!polygons[i]) return ; return "M" + polygons[i].join("L") + "Z"},
    "stroke": "#ccc",
    "stroke-width":2,
    fill:function(d, i){ return colorGen() },
    "fill-opacity": 0.5,
    "mask":"url(#mask)"
  });

  //地形(マスク)要素追加
  var maskmap = mask.append("g")
  .selectAll(".mask")
  .data(geodata)
  .enter()
  .append("svg:path")
  .attr({
    "class":"mask",
    "d":path,
    "fill":"white",
    "stroke": "black",
    "stroke-width":2
  });

  //地形(強調用)要素追加
  var map = svg.append("g")
  .selectAll(".map")
  .data(geodata)
  .enter()
  .append("svg:path")
  .attr({
    "class":"map",
    "d": path,
    "fill":"white",
    "fill-opacity":0,
    "stroke": "white",
    "stroke-opacity":1
  })
  // .on("mouseover", function(d) {
  //   tooltip.style("visibility", "visible");
  // })
  // .on("mouseout", function(d) {
  //   tooltip.style("visibility", "hidden");
  // })
  // .on("mousemove", function(d){
  //   var content = "<h2>"+d.properties['町名']+"</h2>" +
  //   "<p>人口：" + d.properties['人口'] +"</p>" +
  //   "<p>世帯：" + d.properties['世帯'] + "</p>";
  //   tooltip
  //   .style("top", (d3.event.pageY-10)+"px")
  //   .style("left",(d3.event.pageX+10)+"px")
  //   .html(content);
  // });

  //母点要素追加
  var point = svg.selectAll("point")
  .data(positions)
  .enter()
  .append("svg:circle")
  .attr({
    "cx":function(d, i) { return positions[i].x; },
    "cy":function(d, i) { return positions[i].y; },
    "r":2,
    fill:"#1f3134"
  })
  .on("mouseover", function(d) {
    tooltip.style("visibility", "visible");
    console.log(d);
    d3.selectAll(d.targetClass).classed("emphasis", true);

  })
  .on("mouseout", function(d) {
    tooltip.style("visibility", "hidden");
    d3.selectAll(d.targetClass).classed("emphasis", false);
  })
  .on("mousemove", function(d){
    var content = "<center><h2>医療機関<h2></center>" +
    "<p>名称：" + d.properties["P04_002"] +"</p>" +
    "<p>所在地：" + d.properties["P04_003"] +"</p>" ;
    tooltip
    .style("top", (d3.event.pageY-10)+"px")
    .style("left",(d3.event.pageX+10)+"px")
    .html(content);
  });

  //ドラッグイベント設定
  var drag = d3.behavior.drag().on('drag', function(){
    var tl = mercator.translate();
    mercator.translate([tl[0] + d3.event.dx, tl[1] + d3.event.dy]);
    update();
  });

  //ズームイベント設定
  var zoom = d3.behavior.zoom().on('zoom', function(){
    mercator.scale(200000 * d3.event.scale);
    update();
  });

  //イベントをsvg要素に束縛
  svg.call(zoom);
  svg.call(drag);


  //ズーム・ドラッグ時のアップデーと
  function update(){
    //地形(強調用)アップデート
    map.attr('d', path);
    //地形(マスク)アップデート
    maskmap.attr('d', path);
    //ボロノイアップデート
    var positions = [];
    pointdata.forEach(function(d) {
      var xy = mercator(d.geometry.coordinates);
      positions.push({x:xy[0], y:xy[1], targetClass:".cell"+d.properties["P04_002"], properties:d.properties}); //位置情報→ピクセル
    });
    var polygons = voronoi(positions);
    cell.attr("d", function(d, i) {if(!polygons[i]) return ; return "M" + polygons[i].join("L") + "Z"});
    //母点アップデート
    point.attr({
      "cx":function(d, i) { return positions[i].x; },
      "cy":function(d, i) { return positions[i].y; }
    });
  }
}
