var pieChart_var;
var barChart1_var;
var barChart2_var;
var lda_tag;
var Avg_duration_to_accept;
var Avg_acceptance_rate


// d3.csv("/Data/Output/Output.csv")
// .then(function(datain){
//   // console.log(datain);
//   // data=datain;
//   makeChart(datain)
// });
var data;
d3.csv("/ETL/Data/Output.csv").then(function(datain) {
        data = datain;
        makeChart(data);
    })
    //.then(makeChart(window.data));

var selected_date = 0;
var selectedTag = "svn"

function current_date_filter(row) {
    var dt = addDays("2008-08-01", parseInt(selected_date));
    var firstDay = dt.getFullYear() + "-" + (dt.getMonth() < 10 ? "0" + (dt.getMonth() + 1) : +dt.getMonth() + 1) + "-01";
    return row.Date == firstDay;
}

function current_tag_filter(row) {
    return row.Tag == selectedTag;
}

function convert_to_date(element) {
    return new Date(element);
}

function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

function timechange() {
    selected_date = document.getElementById("timeSlicerInput").value;
    //console.log(selected_date);
    pieChart_var.destroy();
    barChart1_var.destroy();
    barChart2_var.destroy();
    makeChart(data);
}

var ctx = document.getElementById('pieChart').getContext("2d");
var pieCanvas = document.getElementById('pieChart')
pieCanvas.onclick = function(e) {
    var slice = pieChart_var.getElementsAtEventForMode(e, 'nearest', { intersect: true }, true);
    if (slice.length) {
        var pieslice = slice[0];
        pieChart_var.config.data.datasets[pieslice.datasetIndex].offset[pieslice.index] = 20;
        pieChart_var.config.data.datasets[pieslice.datasetIndex].offset.forEach((item, index) => {
            if (index == pieslice.index) {
                pieChart_var.config.data.datasets[pieslice.datasetIndex].offset[pieslice.index] = 20;
            } else {
                pieChart_var.config.data.datasets[pieslice.datasetIndex].offset[index] = 0;
            }
        });

        selectedTag = pieChart_var.config.data.labels[pieslice.index];
        data_date_tag_filtered = data_date_filtered.filter(current_tag_filter);
        lda_tag = data_date_tag_filtered.map(function(d) {
            return d.lda_tag;
        });
        Avg_duration_to_accept = data_date_tag_filtered.map(function(d) {
            return d.Avg_duration_to_accept;
        });
        Avg_acceptance_rate = data_date_tag_filtered.map(function(d) {
            return d.Avg_acceptance_rate;
        });
        barChart1_var.config.data.datasets[0].data = Avg_duration_to_accept
        barChart1_var.config.data.labels = lda_tag
        barChart2_var.config.data.labels = lda_tag
        barChart2_var.config.data.datasets[0].data = Avg_acceptance_rate

        var max_Score = Math.max(...data_date_tag_filtered.map(function(d) {
            return parseInt(d.Max_Score);
        }))
        var avg_Score_arr = data_date_tag_filtered.map(function(d) {
            return parseInt(d.Avg_Score);
        })
        const sum = avg_Score_arr.reduce((a, b) => a + b, 0);
        const avg = (sum / avg_Score_arr.length) || 0;

        document.getElementById('MaxSxore').innerHTML = max_Score
        document.getElementById('AvgSxore').innerHTML = avg
        var dt = addDays("2008-08-01", parseInt(selected_date));
        var display_month = monthNames[dt.getMonth()] + " " + dt.getFullYear();
        document.getElementById('currentdate').innerHTML = display_month

        pieChart_var.update();
        barChart1_var.update();
        barChart2_var.update();
    }
}

function filter_duplicate(value, index, array) {
    return array.indexOf(value) === index;
}

const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function makeChart(data) {

    data_date_filtered = data.filter(current_date_filter);
    selectedTag = data_date_filtered.map(function(d) {
        return d.Tag;
    })[0];
    data_date_tag_filtered = data_date_filtered.filter(current_tag_filter);

    var max_Score = Math.max(...data_date_tag_filtered.map(function(d) {
        return parseInt(d.Max_Score);
    }))
    var avg_Score_arr = data_date_tag_filtered.map(function(d) {
        return parseInt(d.Avg_Score);
    })
    const sum = avg_Score_arr.reduce((a, b) => a + b, 0);
    const avg = (sum / avg_Score_arr.length) || 0;

    document.getElementById('MaxSxore').innerHTML = max_Score
    document.getElementById('AvgSxore').innerHTML = avg
    var dt = addDays("2008-08-01", parseInt(selected_date));
    var display_month = monthNames[dt.getMonth()] + " " + dt.getFullYear();
    document.getElementById('currentdate').innerHTML = display_month
        /*
        Pie Chart:
          labels - Tags 
          values - count of rows for the tag
          interaction - 
            -on click should change the other bar charts filtered by the selected tag
            -filtered by Date

          From SQL API - 
          SELECT Tags, count(*) from dbo.Table where Date = selected_date group by Tags 
        */
    var tags = data_date_filtered.map(function(d) {
        return d.Tag;
    });
    tags_new = tags.filter(filter_duplicate);
    // var row_count = data_date_filtered.map(function(d) {
    //   return d.Tag_Row_count;
    // });
    var row_count = []
    tags_new.forEach((item, index) => {
        row_count.push(data_date_filtered.filter((d) => {
            return d.Tag == item
        }).length)
    })

    var offset_arr = new Array(tags.length).fill(0);
    offset_arr[0] = 20;

    pieChart_var = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: tags_new,
            datasets: [{
                data: row_count,
                offset: offset_arr
            }]
        },
        options: {
            maintainAspectRatio: false,
        }
    });


    /*
    Bar Chart 1:
      x axis - lda_tag	
      y axis - Avg_duration_to_accept
      interaction - 
        -filtered by Date and default tag

      From SQL API - 
      SELECT LDA_Tag, duration from dbo.Table where Date = selected_date and Tag=selected_tag group by Tags 
    */
    lda_tag = data_date_tag_filtered.map(function(d) {
        return d.lda_tag;
    });
    Avg_duration_to_accept = data_date_tag_filtered.map(function(d) {
        return d.Avg_duration_to_accept;
    });

    barChart1_var = new Chart(document.getElementById('barChart1'), {
        type: "bar",
        data: {
            labels: lda_tag,
            datasets: [{
                data: Avg_duration_to_accept,
                barThickness: 20,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Average Duration to Accept',
                    color: "#FFFFFF"
                }
            },
            scales: {
                x: {
                    ticks: { color: 'white', beginAtZero: true }
                }
            }
        },
    });
    console.log(barChart1_var)
        /*
  Bar Chart 2:
    x axis - lda_tag	
    y axis - Avg_acceptance_rate
    interaction - 
      -filtered by Date and default tag

    From SQL API - 
    SELECT LDA_Tag, Avg_acceptance_rate from dbo.Table where Date = selected_date and Tag=selected_tag group by Tags 
  */
    Avg_acceptance_rate = data_date_tag_filtered.map(function(d) {
        return d.Avg_acceptance_rate;
    });

    barChart2_var = new Chart(document.getElementById('barChart2'), {
        type: "bar",
        data: {
            labels: lda_tag,
            datasets: [{
                data: Avg_acceptance_rate,
                barThickness: 20,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Average Acceptance Rate',
                    color: "#FFFFFF"
                }
            },
            scales: {
                x: {
                    ticks: { color: 'white', beginAtZero: true }
                }
            }
        }
    });
}