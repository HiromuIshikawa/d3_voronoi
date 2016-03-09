var h = 1000;
var w = 1000;

var color = d3.scale.category20();

var svg = d3.select("body").append("svg")
.attr({
  "width": w,
  "height": h
})





d3.json("kurashiki.geojson", function(error, kurashiki) {
  console.log(kurashiki);

  // 地理座標から画面表示への投影法の設定。
  var mercator = d3.geo.mercator()
  .center([133.746748, 34.556963])
  .translate([w/2, h/2])
  .scale(100000);


  // geojsonからpath要素を作るための設定。
  var geopath = d3.geo.path()
  .projection(mercator);


  svg.append("g")
  .selectAll("path")
  .data(kurashiki.features) // geojsonのすべての県の座標データを読み込む。
  .enter().append("path")
  .attr("d", geopath)
  .attr("fill","lightgreen");


  d3.json('P04-14_33_GML/iryou.geojson', function(json){
    //cellを表示するグループを作成
    var cellgroup = svg.append("svg:g").attr("id", "cells");

    var pointdata = json.features;
    var positions = [];

    pointdata.forEach(function(d) {
      positions.push(mercator(d.geometry.coordinates)); //位置情報→ピクセル
    });

    //ボロノイ変換関数
    var polygons = d3.geom.voronoi(positions);

    //ポイントデータをバインディング
    var cell = cellgroup.selectAll("g")
    .data(pointdata)
    .enter()
    .append("svg:g");

    //境界表示
    cell.append("svg:path")
    .attr("class", "cell")
    .attr({
      "d":function(d, i) {
        if(!polygons[i]) return ;
        return "M" + polygons[i].join("L") + "Z";},
        "stroke":"#43676b",
        "fill":"none"
      })

      //母点表示
      cell.append("svg:circle")
      .attr({
        "cx":function(d, i) { return positions[i][0]; },
        "cy":function(d, i) { return positions[i][1]; },
        "r":2,
        fill:"#1f3134"
      });
    });

  });
