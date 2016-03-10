
var h = 1500;
var w = 1500;

var color = d3.scale.category20();
//カラースケールを作成


var tooltip = d3.select("body")
.append("div")
.append("span")
.attr("id", "tooltip")
.style({
	"position": "absolute",
	"z-index": 10,
	"visibility": "hidden",
	"padding": "0 5px",
	"border": "1px solid #000",
	"border-radius": "3px",
	"color": "#fff",
	"font-size": "11px",
	"opacity": 0.8,
	"background-color":"#000"
})


tooltip.append("span")
.attr("id","dist")
tooltip.append("br")
tooltip.append("span")
.attr("id","address")
tooltip.append("br")
tooltip.append("span")
.attr("id","name")

var svg = d3.select("body").append("svg")
.attr({
	"width": w,
	"height": h
})

var mask = svg.append("defs").append("mask").attr("id", "mask").append("g");
// 地理座標から画面表示への投影法の設定。
var mercator = d3.geo.mercator()
.center([133.746748, 34.556963])
.translate([w/2, h/2])
.scale(200000);

// geojsonからpath要素を作るための設定。
var geopath = d3.geo.path()
.projection(mercator);


d3.json("kurashiki4.geojson", function(error, kurashiki) {
	d3.json("kurashiki.geojson", function(error, maskgeo) {
		d3.csv('jinkou2.csv', function(jinkou){
			var max = d3.max(jinkou, function(d){

				return +d["計"];
			});

			var colorScale = d3.scale.linear().domain([0, max]).range(["#FFE0F0", "#DC143C"]);
			svg.attr({
				"x":0,
				"y":0,
				"width":w,
				"height":h
			})
			.append("g")
			.selectAll("path")
			.data(kurashiki.features)
			.enter().append("path")
			.attr({
				"d": geopath,
				"fill": function(d){
					for(var i = 0; i < jinkou.length; i++){
						if(d.properties.MOJI.startsWith(jinkou[i]["区分"])){
							return colorScale(jinkou[i]["計"]);
						}
					}

					return colorScale(0)

				},
				"stroke": "white",
				"stroke-width":1
			})
			.on("mouseover", function(d){
				d3.select("#dist").text(function(){
					for(var i = 0; i < jinkou.length; i++){
						if(d.properties.MOJI.startsWith(jinkou[i]["区分"])){
							return "町名: " + jinkou[i]["区分"];
						}
					}
					return "町名: " + d.properties.MOJI;
				});
				d3.select("#address").text(function(){
					for(var i = 0; i < jinkou.length; i++){
						if(d.properties.MOJI.startsWith(jinkou[i]["区分"])){
							return "世帯: " + jinkou[i]["世帯数"];
						}
					}
					return "世帯: 0";
				})
				d3.select("#name").text(function(){
					for(var i = 0; i < jinkou.length; i++){
						if(d.properties.MOJI.startsWith(jinkou[i]["区分"])){
							return "人口: " + jinkou[i]["計"];
						}
					}
					return "人口: 0";
				});
				return d3.select("#tooltip").style("visibility", "visible")
				.style("background-color", "gray");
			})
			.on("mousemove", function(d){return d3.select("#tooltip").style("top", (event.pageY+20)+"px").style("left",(event.pageX+10)+"px");})
			.on("mouseout", function(d){
				return d3.select("#tooltip").style("visibility", "hidden");
			});

			//地形(マスク)要素追加
			var maskmap = mask.append("g")
			.selectAll(".mask")
			.data(maskgeo.features)
			.enter().append("path")
			.attr({
				"class":"mask",
				"d":geopath,
				"fill":"white",
				"stroke": "black",
				"stroke-width":2
			});



			d3.csv('hinan.csv', function(data){


				//cellを表示するグループを作成
				var cellgroup = svg.append("g").attr("id", "cells");

				var positions = [];

				data.forEach(function(d) {
					positions.push(mercator([d.lng,d.lat])); //位置情報→ピクセル
				});

				//ボロノイ変換関数
				var polygons = d3.geom.voronoi(positions);

				//ポイントデータをバインディング
				var cell = cellgroup.selectAll("g")
				.data(data)
				.enter()
				.append("g");

				//境界表示
				cell.append("path")
				.attr("class", "cell")
				.attr({
					"d":function(d, i) {
						if(polygons[i]){
							return "M" + polygons[i].join("L") + "Z";
						}
					},
					"stroke":"#43676b",
					"fill":"none",
					"mask":"url(#mask)"
				})


				//母点表示
				cell.append("circle")
				.attr({
					"cx":function(d, i) { return positions[i][0]; },
					"cy":function(d, i) { return positions[i][1]; },
					"r":2,
					fill:"#1f3134"
				})
				.on("mouseover", function(d){
					d3.select("#dist").text("地区:"+d.dist);
					d3.select("#address").text("住所:"+d.address);
					d3.select("#name").text("施設名:"+d.place);
					return d3.select("#tooltip").style("visibility", "visible")
					.style("background-color", "black");
				})
				.on("mousemove", function(d){return d3.select("#tooltip").style("top", (event.pageY+20)+"px").style("left",(event.pageX+10)+"px");})
				.on("mouseout", function(d){
					return d3.select("#tooltip").style("visibility", "hidden");
				});


			});
		});
	});
});
