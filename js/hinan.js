
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
.scale(130000);

// geojsonからpath要素を作るための設定。
var geopath = d3.geo.path()
.projection(mercator);


d3.json("src/kurashiki4.geojson", function(error, kurashiki) {
	d3.json("src/kurashiki.geojson", function(error, maskgeo) {

		var max = d3.max(kurashiki.features, function(d){

			return d.properties.JINKO;
		});

		var colorScale = d3.scale.linear().domain([0, max]).range(["#FFE0F0", "#DC143C"]);

		var map = svg
		.append("g")
		.selectAll("path")
		.data(kurashiki.features)
		.enter().append("path")
		.attr({
			"d": geopath,
			"fill": function(d){ return colorScale(d.properties.JINKO)
			},
			"stroke": "white",
			"stroke-width":1
		})
		.on("mouseover", function(d){
			d3.select("#dist").text("町名: " + d.properties.MOJI);
			d3.select("#address").text("世帯: "+ d.properties.SETAI);
			d3.select("#name").text("人口: " + d.properties.JINKO + "人");
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



		d3.csv('src/hinan.csv', function(data){


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
			var border = cell.append("path")
			.attr("class", function(d){ return "cell"+ d.place;})
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
			var point = cell.append("circle")
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



			//ドラッグイベント設定
			var drag = d3.behavior.drag().on('drag', function(){
				var tl = mercator.translate();
				mercator.translate([tl[0] + d3.event.dx, tl[1] + d3.event.dy]);
				update();
			});

			//ズームイベント設定
			var zoom = d3.behavior.zoom().on('zoom', function(){
				mercator.scale(130000 * d3.event.scale);
				update();
			});

			//イベントをsvg要素に束縛
			svg.call(zoom);
			svg.call(drag);

			function update(){
				//地形(強調用)アップデート
				map.attr('d', geopath);
				//地形(マスク)アップデート
				maskmap.attr('d', geopath);
				//ボロノイアップデート
				var positions = [];
				data.forEach(function(d) {
					positions.push(mercator([d.lng,d.lat])); //位置情報→ピクセル
				});
				var polygons = d3.geom.voronoi(positions);
				border.attr("d", function(d, i) {
					if(polygons[i]){
						return "M" + polygons[i].join("L") + "Z";
					}
				});
				//母点アップデート
				point.attr({
					"cx":function(d, i) { return positions[i][0]; },
					"cy":function(d, i) { return positions[i][1]; }
				});
			}
		});
	});
});
