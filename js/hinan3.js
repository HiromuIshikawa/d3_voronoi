
var h = 900;
var w = 1200;

var color = d3.scale.category20();
//カラースケールを作成

// tooltip作成
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
	"background-color":"#fff"
})

tooltip.append("span")
.attr("id","dist")
tooltip.append("br")
tooltip.append("span")
.attr("id","address")
tooltip.append("br")
tooltip.append("span")
.attr("id","name")

// タイトル作成
d3.select("body").append("div")
.attr("id","title");

d3.select("#title")
.append("h2")
.text("倉敷市の避難所ボロノイ図及び人口分布");


d3.select("body").append("div")
.attr("id","map");

var svg = d3.select("#map").append("svg")
.attr({
	"width": w,
	"height": h
})

var mask = svg.append("defs").append("mask").attr("id", "mask").append("g");
// 地理座標から画面表示への投影法の設定。
var mercator = d3.geo.mercator()
.center([133.746748, 34.543963])
.translate([(w-300)/2, h/2])
.scale(160000);

// geojsonからpath要素を作るための設定。
var geopath = d3.geo.path()
.projection(mercator);


var cityg = svg.append("g")
.attr({
	"class":"cityg",
	"transform":"translate(750,200)"
});

cityg.append("text")
.attr({
	id:"cityname",
	x:0,
	y:0,
	"font-weight":"bold",
	"font-size":20
})
.text("地図上の町をクリック");
cityg.append("text")
.attr({
	x:0,
	y:30,
	"font-size":17
})
.text("世帯数：");
cityg.append("text")
.attr({
	x:0,
	y:50,
	"font-size":17
})
.text("人口：");

cityg.append("text")
.attr({
	id:"setai",
	x:100,
	y:30,
	"font-size":17
});

cityg.append("text")
.attr({
	id:"jinko",
	x:100,
	y:50,
	"font-size":17
});


d3.json("src/kurashiki4.geojson", function(error, kurashiki) {
	d3.json("src/kurashiki.geojson", function(error, maskgeo) {

		var max = d3.max(kurashiki.features, function(d){
			return d.properties.JINKO;
		});

		var colorScale = d3.scale.linear().domain([0, max]).range(["rgb(210,230,255)","rgb(8,48,107)"]);
		var sfrag = [];
		for(var i = 0; i < kurashiki.features.length; i++){ sfrag.push({frag:0});}

		var map = svg
		.append("g")
		.selectAll("path")
		.data(kurashiki.features)
		.enter().append("path")
		.attr({
			"id":function(d,i){return "city"+i;},
			"d": geopath,
			"fill": function(d){ return colorScale(d.properties.JINKO)
			},
			"stroke": "white",
			"stroke-width":1
		})
		.on("click", function(d,i){

			if(sfrag[i].frag == 0){
				d3.select(this).attr({
					"stroke":"#696969",
					"stroke-width":2.5
				});
				for(var j=0;j<kurashiki.features.length;j++){
					if(j==i){continue;}
					d3.select("#city"+j)
					.attr({
						"stroke":"white",
						"stroke-width":1
					});
					sfrag[j].frag = 0;
				}
			}
			d3.select("#cityname")
			.text(function(){ return d.properties.MOJI; });
			d3.select("#setai")
			.text(function(){ return d.properties.SETAI + "世帯"; });
			d3.select("#jinko")
			.text(function(){ return d.properties.JINKO + "人"; });
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
					console.log(d.place)
				},
				"stroke":"#43676b",
				"fill":"none",
				"mask":"url(#mask)"
			});

			//母点表示
			var point = cell.append("circle")
			.attr({
				"class":function(d){ return "circle"+ d.place;},
				"cx":function(d, i) { return positions[i][0]; },
				"cy":function(d, i) { return positions[i][1]; },
				"r":2,
				fill:"#008080"
			})
			.on("mouseover", function(d){
				var dist = ".cell"+d.place;
				d3.select(dist).attr("fill","rgba(0,128,128,0.4)");
				d3.select(this).attr("fill","red");
				d3.select("#dist").text("地区:"+d.dist);
				d3.select("#address").text("住所:"+d.address);
				d3.select("#name").text("施設名:"+d.place);
				return d3.select("#tooltip").style("visibility", "visible")
				.style("background-color", "black");
			})
			.on("mousemove", function(d){return d3.select("#tooltip").style("top", (event.pageY+20)+"px").style("left",(event.pageX+10)+"px");})
			.on("mouseout", function(d){
				var dist = ".cell"+d.place;
				d3.select(dist).attr("fill","none");
				d3.select(this).attr("fill","#008080");
				return d3.select("#tooltip").style("visibility", "hidden");
			});

			makeLegend();

			// 凡例及び説明の記述

			function makeLegend(){
				//凡例用グラデーション定義
				var grad1 =		svg.append("defs")
				.append("linearGradient")
				.attr("id","legendgrad");

				grad1.append("stop").attr({
					"offset":0,
					"stop-color":"rgb(210,230,255)"
				});
				grad1.append("stop").attr({
					"offset":1,
					"stop-color":"rgb(8,48,107)"
				});

				var legendfont=18;

				var legendg = svg.append("g")
				.attr({
					"class":"legend",
					"transform":"translate(30,700)"
				});

				legendg.append('circle')
				.attr({
					cx:5,
					cy:5,
					r:2,
					fill:"#008080"
				})
				.on("mouseover",function(d){d3.select(this).attr("fill","red");})
				.on("mouseout", function(d){d3.select(this).attr("fill","#008080");});


				legendg.append("text")
				.attr({
					x:10,
					y:5,
					"dominant-baseline":"middle",
					"font-size":legendfont
				})
				.text("：避難所");
				legendg.append("text")
				.attr({
					x:10,
					y:22,
					"dominant-baseline":"middle",
					"font-size":legendfont-5
				})
				.text("※マウスオーバーすると避難所の対象地区、名前、住所が表示され、");
				legendg.append("text")
				.attr({
					x:10,
					y:35,
					"dominant-baseline":"middle",
					"font-size":legendfont-5
				})
				.text("　 避難所を含むボロノイ領域が強調されます");

				legendg.append("text")
				.attr({
					x:5,
					y:67,
					"font-size":legendfont
				})
				.text("人口");

				legendg.append("rect")
				.attr({
					x:43,
					y:53,
					width:150,
					height:15,
					fill:"url(#legendgrad)"
				});

				legendg.append("text")
				.attr({
					x:38,
					y:80,
					"font-size":legendfont-5
				})
				.text("少");
				legendg.append("text")
				.attr({
					x:185,
					y:80,
					"font-size":legendfont-5
				})
				.text("多");
			}


		});
	});
});
