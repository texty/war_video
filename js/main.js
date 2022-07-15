const ROOT = 'https://texty.org.ua/d/2022/'
const month_list = locale.month_list;
const month = d3.timeMonths(new Date("2021-12-31"), new Date());
console.log(month)
var month_data = [];
var currentDate = null;
var currentCategory = null;
var currentRegion = null;

readUrlParams();

var showAllDates = currentDate === null;
var showAllCategories = currentCategory === null;
var showAllRegions = currentRegion === null;


const observer = lozad('.lozad', {
    rootMargin: '500px 0px',
});


for(var i = 0; i < month.length; i++){
    month_data.push(month_list[month[i].getMonth()])
}

const width = 60 * (month.length-1),
    height = 136,
    cellSize = 12;

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
    .attr("transform", "translate(" + '-60' + "," + 0 + ")");

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
    .attr("transform", "translate(" + '-55' + "," + -10 + ")")    
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

function localize_video(d){
    let locale_name = locale.__name;
    let sfx = locale.__suffix;

    let category = d.attrs['category' + sfx] || locale.unknown;
    let region = d.attrs['region' + sfx];
    let location = d.attrs['location' + sfx];

    d.attrs.category = category;
    d.attrs.region = region;
    d.attrs.location = location;
}

//load data
d3_jsonl("https://texty.org.ua/d/2022/war_video_data/media.merged.jsonl?" + (+ new Date())).then(function (video) {

    const date_format = d3.timeFormat("%Y-%m-%d"); 
    var categories_list = [];
    var region_list = [];

    video = video.filter(function(d){ return d.attrs !== null});

    video.forEach(function (d) {
        d.parced_date = d3.timeParse('%Y-%m-%dT%H:%M:%S+00:00')(d.video_date_altered)
        d.date = date_format(d.parced_date);
        
        localize_video(d)

        //список унікальних категорій
        let categories = d.attrs.category.split(',');
        for(i in categories){
            let item = categories[i].trim();
            if(!categories_list.includes(item)) {
                categories_list.push(item)
            }
        } 

        //список унікальних областей
        let region = d.attrs.region;
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

    
    calendar_select_date(currentDate);
    category_select(currentCategory);
    region_select(currentRegion);

    
    // aggregated data for calendar picker    
    var data = d3.nest()
        .key(function (d) { return d.date; })           
        .entries(video);


    //calendar: select the day    
    rect
        .on('click', calendar_select_date)

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
            .on('click', calendar_select_date.bind(this, null))  


        d3.select("#category-select").on("change", function() {
            let selected = d3.select(this).property("value");
            category_select(selected);
        });

        d3.select("#show-all-categories").on("click", category_select.bind(this, null))

        d3.select("#region-select").on("change", function(){
            let selected = d3.select(this).property("value");
            region_select(selected);   
        }); 

        d3.select("#show-all-regions").on("click", region_select.bind(this, null));

        updateVideo();

        function region_select(region) {
            if (!region) {
                d3.select('#show-all-regions').html(locale.region_is_not_selected);
                d3.select("#region-select").property('value', 'null');
                currentRegion = null;
                
                if(showAllRegions === false){
                    showAllRegions = true; 
                    updateVideo(); 
                }

            } else {
                d3.select('#show-all-regions').html(locale.remove_filter);
                d3.select("#region-select").property('value', region);
                currentRegion = region;   
                showAllRegions = false;          
                updateVideo();           
            }
        }

        function category_select(category) {
            if (!category) {
                d3.select('#show-all-categories').html(locale.category_is_not_selected);
                d3.select("#category-select").property('value', 'null');
                currentCategory = null;             
                if (showAllCategories === false ){
                    showAllCategories = true; 
                    updateVideo(); 
                }
            } else {
                currentCategory = category; 
                showAllCategories = false;
                d3.select("#category-select").property('value', category);
                d3.select('#show-all-categories').html(locale.remove_filter)
                updateVideo();          
            }
        }

        function calendar_select_date(date){  
            if (!date) {                
                d3.selectAll('.video-item').style("display", 'block');
                d3.select('#selected-date').html(locale.select_date);
                d3.select('#show_all_dates').html(locale.date_is_not_selected);
                d3.selectAll('.day').attr("stroke", "black"); 
                currentDate = null;  
                if(showAllDates === false){
                    showAshowAllDatesllCategories = true; 
                    updateVideo(); 
                }             
            } else {
                currentDate = date;
                showAllDates = false;
                updateVideo();
                d3.selectAll('.day')
                    .attr("stroke", "black")
                    .filter(d => d === date)
                    .attr("stroke", "red").attr("stroke-width","2px").raise();

                d3.select("#selected-date").text(date)
                d3.select('#show_all_dates').html(locale.remove_filter)
            }
        }
        
        function get_location_string(d) {

            if (d.attrs.location && d.attrs.location !==locale.unknown) {
                return d.attrs.location;
            }
            
            if (d.attrs.region && d.attrs.region !== locale.unknown) {
                return d.attrs.region + locale.obl;
            }
            
            return locale.place_unknown;
        }

        //фільтруємо відео
        function updateVideo(){ 
            let videoToShow = video
                .filter(function(d){ return currentDate !== null ? d.date === currentDate : d;})
                .filter(function(d){ return currentRegion !== null ? d.attrs.region === currentRegion : d;})
                .filter(function(d){ return currentCategory !== null ? d.attrs.category.includes(currentCategory) : d;})
           
     
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

                    var location_string = get_location_string(d)
                    
                    return "<span>"+ location_string + "<br>" + d.date + " / " + tg + "</span>"
                })

            items
                .append("video") 
                .attr('class', 'lozad')           
                .attr("data-poster", function(d){ return ROOT + d.thumb1_path})
                .attr("preload", "none")
                .attr('controls', "")
                .append('source')
                .attr('data-src', function (d) { return ROOT + d.file_path })
                .attr('type', 'video/mp4')

                observer.observe();

            updateUrlParams();
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

function constructUrlParams() {
    let res = {};

    if (currentDate) {
        res.date = currentDate;
    }

    if (currentCategory) {
        res.category = currentCategory;
    }

    if (currentRegion) {
        res.region = currentRegion;
    }

    return res;
}

function updateUrlParams() {
    const urlParams = new URLSearchParams("");
    
    let params = constructUrlParams();
    
    Object.keys(params).forEach(function(key) {
        urlParams.set(key, params[key])
    })

    let qs = "?" + urlParams.toString();

    window.history.replaceState(null, null, qs);
}

function readUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);

    currentDate = urlParams.get('date')
    currentCategory = urlParams.get('category')
    currentRegion = urlParams.get('region')
}