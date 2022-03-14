const ROOT = 'https://texty.org.ua/d/2022/war_video/'
const month_list = ['січ','лют','бер','кві','тра','чер','лип','сер','вер','жов','лис','гру'];
const month = d3.timeMonths(new Date("2021-12-31"), new Date());
var month_data = [];
for(var i = 0; i < month.length; i++){
    console.log(month[i].getMonth())
    month_data.push(month_list[month[i].getMonth()])
}

var width = 200,
    height = 136,
    cellSize = 14;

var color = d3.scaleQuantize()
    .domain([1, 25])
    .range(['#e7d7d3','#efbcaf','#f2a18b', '#f18569', '#ed6746' ]);

var svg = d3.select("#calendar-wrapper")
    .selectAll("svg")
    .data(d3.range(2022, 2023))
    .enter().append("svg")
    .attr("width", width)
    .attr("height", height)

var svg_g = svg    
    .append("g")
    .attr("transform", "translate(" + '-60' + "," + 10 + ")");

 svg_g.append("text")
    .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
    .attr("font-family", "sans-serif")
    .attr("font-size", 10)
    .attr("text-anchor", "middle")
    .text(function (d) { return d; });

var rect = svg_g.append("g")
    .attr("fill", "none")
    .selectAll("rect")
    .data(function (d) { return d3.timeDays(new Date(d, 1, 24), new Date()); })
    .enter()
    .append("rect")
    .attr('class', 'day')
    .attr("width", cellSize)
    .attr("height", cellSize)
    .attr("x", function (d) { return d3.timeWeek.count(d3.timeYear(d), d) * cellSize; })
    .attr("y", function (d) { return d.getDay() * cellSize; })
    .attr("stroke", "black")
    .style("opacity", "0.9")
    .on("mouseenter", function(){
            d3.selectAll('.day').style("opacity", 0.9)
            d3.select(this).style("opacity", 1)
        })        
    .datum(d3.timeFormat("%Y-%m-%d"));


svg_g.append("g")
    .attr("fill", "none")
    .attr("stroke", "white")
    .attr("stroke-width", "2px")
    .selectAll("path")
    .data(function (d) { return d3.timeMonths(new Date(d, 0, 31), new Date()); })
    .enter()
    .append("path")
    .attr("d", pathMonth);
    
    
var legend = svg
    .append("g")    
    .attr("transform", "translate(" + '-60' + "," + 10 + ")")    
    .selectAll(".legend")
    .data(month_data)
    .enter()
    .append('g')	
    .attr("class", "legend")    
    .attr("transform", function(d, i) { return "translate(" + (((cellSize*4.3)*i)+(width/100)) + ","+ (height-20) +")"; })
    .append("text")
    .attr("x", 0)
    .attr("y", 0)
    .text(function(d){ return d})
    .style('font-size', '14px')
    .style('letter-spacing', '1px')
    .attr("fill", "white");    

d3.select('#show_all_video')
        .on('click', function(){               
            d3.selectAll('.video-item').style("display", 'block');
            d3.select('#selected-date').html('Оберіть день:');
            d3.select('#show_all_video').html('Показано всі відео');
            d3.selectAll('.day').attr("stroke", "white");  
})

function d3_jsonl(url) {
    return d3.text(url).then(function (text) {
        return text.trim().split('\n').map(JSON.parse);
    });
    }

//load data
d3_jsonl(ROOT + "data/media.jsonl").then(function (video) {

    const date_format = d3.timeFormat("%Y-%m-%d"); 

    video.forEach(function (d) {
        d.parced_date = d3.timeParse('%Y-%m-%dT%H:%M:%S+00:00')(d.video_date)
        d.date = date_format(d.parced_date)
       
    });    
    
    video = video.sort(function(a,b){ return a.parced_date  - b.parced_date})


    var items = d3.select("#video-wrapper")
        .selectAll(".video-item")
        .data(video)
        .enter()
        .append("div")
        .attr("class", "video-item");

    var decription = items.append('div')
        .attr('class', 'description')
        .append('p')
        .attr('class', 'tip')
        .html(function (d) {
            return "<span>"+ d.source_title.replace('|','/').split('/')[0] + "</span> <br> <span>" + d.date + "</span>"
        })

    var vid = items
        .append("video")            
        .attr("poster", function(d){ return ROOT + d.thumb1_path})
        .attr("preload", "none")
        .attr('controls', "")
        .append('source')
        .attr('src', function (d) { return ROOT + d.file_path })
        .attr('type', 'video/mp4')

    
    // aggregated data for calendar picker    
    var data = d3.nest()
        .key(function (d) { return d.date; })           
        .entries(video);


    //calendar: select the day    
    rect
        .on('click', function(d){  
            d3.selectAll('.day').attr("stroke", "black")  
            d3.select(this).attr("stroke", "red").attr("stroke-width","2px").raise();
            vid.each(function(t){                    
                d3.select(this.parentNode.parentNode)
                    .style("display", t.date === d ? "block" : "none")
            })
            d3.select("#selected-date").text(d)
            d3.select('#show_all_video').html('Прибрати фільтр &times; ')
        })
        .attr('data-tippy-content', function(d){ return d })
        .attr("fill", function (d) { 
            let el = data.filter(function(t){ return t.key === d })
            return el[0] ? color(el[0].values.length) : 'lightgrey'
        })
        .attr("data-fill", function (d) { 
            let el = data.filter(function(t){ return t.key === d})
            return el[0] ? color(el[0].values.length) : 'lightgrey'
        });   
        
        
        tippy('.day', {                 
            allowHTML: true, 
            maxWidth: 350, 
            placement: 'bottom'               
        });           

})


//taken from https://bl.ocks.org/mbostock/4063318
function pathMonth(t0) {
    var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
        d0 = t0.getDay(), w0 = d3.timeWeek.count(d3.timeYear(t0), t0),
        d1 = t1.getDay(), w1 = d3.timeWeek.count(d3.timeYear(t1), t1);
    return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
        + "H" + w0 * cellSize + "V" + 7 * cellSize
        + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
        + "H" + (w1 + 1) * cellSize + "V" + 0
        + "H" + (w0 + 1) * cellSize + "Z";
}