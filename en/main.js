const ROOT = 'https://texty.org.ua/d/2022/'
const month_list = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const month = d3.timeMonths(new Date("2021-12-31"), new Date());
var month_data = [];
var currentDate = null;
var currentCategory = null;
var currentRegion = null;

var showAllDates = true;
var showAllCategories = true;
var showAllRegions = true;

for(var i = 0; i < month.length; i++){
    month_data.push(month_list[month[i].getMonth()])
}

const width = 270,
    height = 136,
    cellSize = 14;

const color = d3.scaleQuantize()
    .domain([1, 25])
    .range(['#e7d7d3','#efbcaf','#f2a18b', '#f18569', '#ed6746' ]);

var svg = d3.select("#day-select")
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


function d3_jsonl(url) {
    return d3.text(url).then(function (text) {
        return text.trim().split('\n').map(JSON.parse);
    });
    }

//load data
d3_jsonl("https://texty.org.ua/d/2022/war_video_data/media.merged.jsonl?" + (+ new Date())).then(function (video) {

    const date_format = d3.timeFormat("%Y-%m-%d"); 
    var categories_list = [];
    var region_list = [];

    video = video.filter(function(d){ return d.attrs !== null});

    video.forEach(function (d) {
        d.parced_date = d3.timeParse('%Y-%m-%dT%H:%M:%S+00:00')(d.video_date)
        d.date = date_format(d.parced_date);

       

        if(d.attrs.category_en != undefined){
            //список унікальних категорій
            let categories = d.attrs.category_en.split(',');
            
            for(i in categories){               
                let item = categories[i].trim();
                if(!categories_list.includes(item)) {                    
                    categories_list.push(item)
                }
            } 
         } else {
            categories_list.push("Unknown")
         }
        
        

        //список унікальних областей
        let region = d.attrs.region_en;
        if(!region_list.includes(region)) {
            region_list.push(region)
        }         
    });   

    video = video.sort(function(a,b){ return b.parced_date - a.parced_date});

    //додаємо області в select-dropdown
    d3.select('#category-select')
        .selectAll('option.category')
        .data(categories_list).enter()
        .append('option')
        .attr('class', 'category')
        .attr('value', function(d){ return d })
        .text(function(d){ return d });

    //додаємо категорії в select-dropdown
    d3.select('#region-select')
        .selectAll('option.region')
        .data(region_list).enter()
        .append('option')
        .attr('class', 'region')
        .attr('value', function(d){ return d })
        .text(function(d){ return d });        

 

    
    // aggregated data for calendar picker    
    var data = d3.nest()
        .key(function (d) { return d.date; })           
        .entries(video);


    //calendar: select the day    
    rect
        .on('click', function(d){  
            currentDate = d;
            showAllDates = false;
            updateVideo();
            d3.selectAll('.day').attr("stroke", "black")  
            d3.select(this).attr("stroke", "red").attr("stroke-width","2px").raise();
            d3.select("#selected-date").text(d)
            d3.select('#show_all_dates').html('Unselect &times; ')
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

        d3.select('#show_all_dates')
        .on('click', function(){                    
            d3.selectAll('.video-item').style("display", 'block');
            d3.select('#selected-date').html('Select a date:');
            d3.select('#show_all_dates').html("Date isn't selected");
            d3.selectAll('.day').attr("stroke", "black"); 
            currentDate = null;  
            if(showAllDates === false){
                showAshowAllDatesllCategories = true; 
                updateVideo(); 
            }             
        })  


        d3.select("#category-select").on("change", function(){
            let selected = d3.select(this).property("value");
            currentCategory = selected; 
            showAllCategories = false;
            d3.select('#show-all-categories').html('Unselect &times; ')
            updateVideo();          
        });

        d3.select("#show-all-categories").on("click", function(){
            d3.select('#show-all-categories').html("Category isn't selected");
            d3.select("#category-select").property('value', 'null');
            currentCategory = null;             
            if(showAllCategories === false){
                showAllCategories = true; 
                updateVideo(); 
            }
        })


        d3.select("#region-select").on("change", function(){
            let selected = d3.select(this).property("value");   
            d3.select('#show-all-regions').html('Unselect &times;');
            currentRegion = selected;   
            showAllRegions = false;          
            updateVideo();           
        }); 

        d3.select("#show-all-regions").on("click", function(){
            d3.select('#show-all-regions').html("Region isn't selected");
            d3.select("#region-select").property('value', 'null');
            currentRegion = null;
            
            if(showAllRegions === false){
                showAllRegions = true; 
                updateVideo(); 
            }
             
        })

        updateVideo();

        //фільтруємо відео
        function updateVideo(){ 
            let videoToShow = video
                .filter(function(d){ return currentDate !== null ? d.date === currentDate : d;})
                .filter(function(d){ return currentRegion !== null ? d.attrs.region_en === currentRegion : d;})
                .filter(function(d){ return currentCategory !== null && d.attrs.category_en !== undefined ? d.attrs.category_en.includes(currentCategory) : d;})
           
     
            if(videoToShow.length === 0){
                d3.select(".no-video").style("display", "block");
            } else {
                d3.select(".no-video").style("display", "none");
            }

            d3.selectAll('.video-item').remove();


            //додаємо відео    
            var items = d3.select("#video-wrapper")
                .selectAll(".video-item")
                .data(videoToShow)
                .enter()
                .append("div")
                .attr("class", "video-item");

            items.append('div')
                .attr('class', 'description')
                .append('p')
                .attr('class', 'tip')
                .html(function (d) {
                    var tg = d.source_title.replace('|','/').split('/')[0];

                    if(d.attrs.location_en === "Unknown" && d.attrs.region_en === "Unknown"){
                        var location = "Unknown";
                    } else if(d.attrs.location_en === "Unknown" && d.attrs.region_en != "Unknown"){
                        var location = d.attrs.region_en + " region ";
                    } else {
                        var location = d.attrs.location_en;
                    }
                    
                    return "<span>"+ location + "<br>" + d.date + " / " + tg + "</span>"
                })

            items
                .append("video")            
                .attr("poster", function(d){ return ROOT + d.thumb1_path})
                .attr("preload", "none")
                .attr('controls', "")
                .append('source')
                .attr('src', function (d) { return ROOT + d.file_path })
                .attr('type', 'video/mp4')
            }

        d3.select("#scroll-top").on('click', function(){
            window.scrollTo(0, 0)
        })
        
        
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

d3.select('.button').on("click", function(){
    d3.select(".methodology-wrapper")   
    .classed("hidden", !d3.select(".methodology-wrapper").classed("hidden"))
})

