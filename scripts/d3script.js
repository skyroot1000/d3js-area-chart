


function renderChartArea(params) {
  // exposed variables
  var attrs = {

    svgWidth: 400,
    svgHeight: 500,
    marginTop: 50,
    marginBottom: 40,
    marginRight: -5,
    marginLeft: 1,
    gridColor: '#F7F7F9',
    axisColor: '#B9B9C5',
    activeScrollLineColor: '#8D90C5',
    legendRestTextColor: '#9FA1B4',
    legendActiveTextColor: '#BEB72D',
    activeButtonColor: '#4D4092',
    fontFamily: 'Helvetica',
    backgroundFill: 'white',
    firstTime: true,
    data: null
  };


  /*############### IF EXISTS OVERWRITE ATTRIBUTES FROM PASSED PARAM  #######  */

  var attrKeys = Object.keys(attrs);
  attrKeys.forEach(function (key) {
    if (params && params[key]) {
      attrs[key] = params[key];
    }
  })


  //innerFunctions
  var updateData;


  //main chart object
  var main = function (selection) {
    selection.each(function () {

      // convert date
      attrs.data.entities.forEach(e => {
        e.values.forEach(v => {
          v.date = new Date(v.date);
          v.value = Number(v.value)
        })
        e.values.push({
          date: e.values[e.values.length - 1].date,
          value: 50
        })
      })


      //calculated properties
      var calc = {}

      calc.chartLeftMargin = attrs.marginLeft;
      calc.chartTopMargin = attrs.marginTop;

      calc.chartWidth = attrs.svgWidth - attrs.marginRight - calc.chartLeftMargin;
      calc.chartHeight = attrs.svgHeight - attrs.marginBottom - calc.chartTopMargin;

      calc.minDates = attrs.data.entities.map(d => d3.min(d.values, v => v.date));
      calc.maxDates = attrs.data.entities.map(d => d3.max(d.values, v => v.date));

      calc.min = d3.min(calc.minDates);
      calc.max = d3.max(calc.maxDates);


      calc.activeAreaId = attrs.data.entities[attrs.data.entities.length - 1] && attrs.data.entities[attrs.data.entities.length - 1].id;



      //############################   SCALES  ############################
      var scales = {};

      //x axis scale
      scales.x = d3.scaleTime()
        .domain([calc.min, calc.max])
        .range([0, calc.chartWidth]);
      // y axis scale
      scales.y = d3.scaleLinear()
        .range([calc.chartHeight, 0])
        .domain([0, 100])

      //########################  AXES  #############################
      var axes = {};

      //x axis
      axes.x = d3.axisBottom(scales.x)
        .tickSize(-calc.chartHeight)
        .ticks(5)

      //###################### LAYOUTS   ####################

      var layouts = {};
      layouts.area = d3.area()
        .curve(d3.curveCardinal)
        .y0(scales.y(0))
        .y1(d => { return scales.y(d.value) })


      //###################  BEHAVIORS  ######################
      var behaviors = {};
      behaviors.zoom = d3.zoom()
        .scaleExtent([1.01, 100])
        .translateExtent([[-calc.chartWidth, -Infinity], [calc.chartWidth, Infinity]])
        .on('zoom', zoomed)


      //########################  CONTAINERS  #############################
      var container = d3.select(this).html("");

      // NEEDS PATTERNIFY
      var svg = container
        .append('svg')
        .attr('width', attrs.svgWidth)
        .attr('height', attrs.svgHeight)
        .style('overflow', 'visible')
        .style('font-family', attrs.fontFamily)
      // .attr("viewBox", "0 0 " + attrs.svgWidth + " " + attrs.svgHeight)
      // .attr("preserveAspectRatio", "xMidYMid meet")


      svg.append('rect')
        .attr('x', -20)
        .attr('y', -10)
        .attr('width', attrs.svgWidth + 55)
        .attr('height', attrs.svgHeight + 50)
        .attr('fill', attrs.backgroundFill)



      // NEEDS PATTERNIFY
      var chart = svg.append('g')
        .attr('width', calc.chartWidth)
        .attr('height', calc.chartHeight)
        .attr('transform', 'translate(' + (calc.chartLeftMargin) + ',' + calc.chartTopMargin + ')')
        .style('cursor', 'move');


      //##################  GRADIENTS  ######################
      //------------------------  AREA GRADIENTS ----------------------//
      var areaGradient = svg.selectAll('.area-gradients')
        .data(attrs.data.entities)
        .enter()
        .append("defs")
        .append("linearGradient")
        .attr("id", d => "grad" + d.id)
        .attr("x1", "0%")
        .attr("x2", "0%")
        .attr("y1", "0%")
        .attr("y2", "100%")
        .attr("gradientUnits", "userSpaceOnUse")

      areaGradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", d => d.gradient[0])
        .style("stop-opacity", 1)

      areaGradient.append("stop")
        .attr("offset", "100%")
        .style("stop-color", d => d.gradient[1])
        .style("stop-opacity", 1)

      //------------------------  LEGEND GRADIENTS ----------------------//
      var legendGradient = svg.selectAll('l.egend-gradiens')
        .data(attrs.data.entities)
        .enter()
        .append("defs")
        .append("linearGradient")
        .attr("id", d => "legGrad" + d.id)
        .attr("x1", "0%")
        .attr("x2", "10%")
        .attr("y1", "0%")
        .attr("y2", "0%")
        .attr("gradientUnits", "userSpaceOnUse")

      legendGradient.append("stop")
        .attr("offset", "0%")
        .style("stop-color", d => d.gradient[0])
        .style("stop-opacity", 1)

      legendGradient.append("stop")
        .attr("offset", "20%")
        .style("stop-color", d => d.gradient[1])
        .style("stop-opacity", 1)


      // ##################  CHART PARTS #####################

      // x axis wrapper
      var xAxisWrapper = patternify({ container: chart, selector: 'x-axis-wrapper', elementTag: 'g' });
      xAxisWrapper.attr('transform', `translate(0,${calc.chartHeight})`)


      // top chart line 
      chart.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', calc.chartWidth)
        .attr('y2', 0)
        .attr('stroke', attrs.gridColor)
        .attr('stroke-width', 1)

      //areas wrapper
      var areasWrapper = patternify({ container: chart, selector: 'areas-wrapper', elementTag: 'g' })

      // each area wrappers
      var eachAreaWrapper = areasWrapper.selectAll('.each-area-wrapper').data(attrs.data.entities);
      eachAreaWrapper.exit().remove();
      eachAreaWrapper = eachAreaWrapper.enter().append('g').merge(eachAreaWrapper);
      eachAreaWrapper.attr('class', 'each-area-wrapper')
        .attr("fill", (d, i) => { return `url(#grad${d.id}` })
        .attr('data-id', d => d.id)


      //area paths
      var areas = eachAreaWrapper.selectAll('.area').data(d => [d.values]);
      areas.exit().remove()
      areas = areas.enter().append('path').merge(areas);
      areas.attr('class', 'area')
        .attr('shape-rendering', 'crisp-edges')
        .attr("clip-path", "url(#clip)")
        .attr('opacity', 0.7)


      var hidder = patternify({ container: chart, selector: 'hidder-rect', elementTag: 'rect' });
      hidder.attr('width', 15)
        .attr('height', calc.chartHeight + 6)
        .attr('x', calc.chartWidth - 10)
        .attr('y', -3)
        .attr('fill', attrs.backgroundFill)


      var rightBorder = patternify({ container: chart, selector: 'right-border-rect', elementTag: 'rect' });
      rightBorder.attr('width', 1)
        .attr('height', calc.chartHeight)
        .attr('x', calc.chartWidth - 10)
        .attr('fill', attrs.gridColor)


      // zoom rect
      var zoomRect = patternify({ container: chart, selector: 'zoom-rect', elementTag: 'rect' });
      zoomRect.attr('width', calc.chartWidth)
        .attr('height', calc.chartHeight)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')
        .call(behaviors.zoom)
        .on('mousemove', function (d) {
          var mouse = d3.mouse(this);
          var x = mouse[0];
          if (x > calc.chartWidth - 10) x = calc.chartWidth - 10;
          var area = d3.select(`[data-id='${calc.activeAreaId}']`)
          var y = findYatXbyBisection(x, area.select('path').node(), 0.0001)
          tooltipG.attr('transform', `translate(${x},${y})`)
            .attr('opacity', 1)
            .attr('pointer-events', 'none')


          tooltipG.select('text').text(scales.y.invert(y).toFixed(0) + '%')
          console.log(d)
        }).on('mouseleave', function (d) {
          tooltipG.attr('opacity', 0)
        })

      var findYatXbyBisection = function (x, path, error) {
        var length_end = path.getTotalLength()
          , length_start = 0
          , point = path.getPointAtLength((length_end + length_start) / 2) // get the middle point
          , bisection_iterations_max = 50
          , bisection_iterations = 0

        error = error || 0.01

        while (x < point.x - error || x > point.x + error) {
          // get the middle point
          point = path.getPointAtLength((length_end + length_start) / 2)

          if (x < point.x) {
            length_end = (length_start + length_end) / 2
          } else {
            length_start = (length_start + length_end) / 2
          }

          // Increase iteration
          if (bisection_iterations_max < ++bisection_iterations)
            break;
        }
        return point.y
      }


      //##########################  TOOLTIP #########################
      var tooltipG = patternify({ container: chart, selector: 'tooltip-wrapper', elementTag: 'g' });
      tooltipG.attr('opacity', 0)

      var tooltipBackgroundRect = patternify({ container: tooltipG, selector: 'tooltip-background-rect', elementTag: 'rect' });
      tooltipBackgroundRect.attr('fill', attrs.activeButtonColor)
        .attr('width', 60)
        .attr('height', 40)
        .attr('x', -30)
        .attr('y', -60)
        .attr('rx', 5)

      var tooltipArrow = patternify({ container: tooltipG, selector: 'tooltip-arrow-rect', elementTag: 'rect' });
      tooltipArrow.attr('fill', attrs.activeButtonColor)
        .attr('width', 10)
        .attr('height', 10)
        .attr('transform', 'rotate(45) translate(-19,-19)')

      var tooltipText = patternify({ container: tooltipG, selector: 'tooltip-text', elementTag: 'text' });
      tooltipText.text('hi there')
        .attr('fill', 'white')
        .attr('text-anchor', 'middle')
        .attr('y', -34)


      var tooltipCircle = patternify({ container: tooltipG, selector: 'tooltip-circle', elementTag: 'circle' });
      tooltipCircle.attr('r', 5)
        .attr('fill', attrs.activeButtonColor)
        .attr('stroke-width', 2)
        .attr('stroke', 'white')

      //clippath
      var clipPath = patternify({ container: chart, selector: 'clip-path', elementTag: 'clipPath' });
      clipPath.attr('id', 'clip')

      var clipPathRect = patternify({ container: clipPath, selector: 'clip-path-rect', elementTag: 'rect' });
      clipPathRect.attr('width', calc.chartWidth)
        .attr('height', calc.chartHeight)



      //scroll line
      var scrollLineBackground = patternify({ container: chart, selector: 'scroll-line-background', elementTag: 'line' });
      scrollLineBackground.attr('x1', 0)
        .attr('x2', calc.chartWidth - 10)
        .attr('y1', calc.chartHeight + 60)
        .attr('y2', calc.chartHeight + 60)
        .attr('stroke', attrs.gridColor)
        .attr('stroke-width', 5)


      //active scroll line
      var scrollLineActive = patternify({ container: chart, selector: 'scroll-line-active', elementTag: 'line' });
      scrollLineActive.attr('x1', 0)
        .attr('x2', calc.chartWidth - 10)
        .attr('y1', calc.chartHeight + 60)
        .attr('y2', calc.chartHeight + 60)
        .attr('stroke', attrs.activeScrollLineColor)
        .attr('stroke-width', 5)

      var scrollHidder = patternify({ container: chart, selector: 'scroll-hidder-rect', elementTag: 'rect' });
      scrollHidder.attr('width', 15)
        .attr('height', 40)
        .attr('x', calc.chartWidth - 10)
        .attr('y', calc.chartHeight + 40)
        .attr('fill', 'white')


      var rightBorder = patternify({ container: chart, selector: 'right-border-rect', elementTag: 'rect' });
      rightBorder.attr('width', 1)
        .attr('height', calc.chartHeight)
        .attr('x', calc.chartWidth - 10)
        .attr('fill', attrs.gridColor)


      //legend wrappers
      var activeButton = patternify({ container: svg, selector: 'active-button', elementTag: 'rect' });
      activeButton.attr('width', function () {
        var spacing = 140;
        if (calc.chartWidth < 533) spacing = 110;
        if (calc.chartWidth < 400) spacing = 90;
        return spacing;
      })
        .attr('height', 45)
        .attr('fill', attrs.activeButtonColor)
        .attr('rx', 5)
        .attr('x', attrs.marginLeft)

      var legendWrappers = svg.selectAll('.legend-wrapper').data(attrs.data.entities.reverse());
      legendWrappers.exit().remove();
      legendWrappers = legendWrappers.enter().append('g').merge(legendWrappers);
      legendWrappers.attr('class', 'legend-wrapper')
        .attr('transform', (d, i) => {
          var spacing = 140;
          if (calc.chartWidth < 533) spacing = 110;
          if (calc.chartWidth < 400) spacing = 90;

          return `translate(${i * spacing + 10},15)`
        })
        .style('cursor', 'pointer')
        .each((d, i) => d.parentIndex = i)
        .on('click', function (d) {
          var spacing = 140;
          if (calc.chartWidth < 533) spacing = 110;
          if (calc.chartWidth < 400) spacing = 90;

          calc.activeAreaId = d.id;
          var g = d3.select(this);
          legendTexts.attr('fill', attrs.legendRestTextColor);
          g.select('text').attr('fill', attrs.legendActiveTextColor);

          activeButton.attr('x', d.parentIndex * spacing + 0)

          svg.selectAll('.each-area-wrapper').sort(function (a, b) {
            // select the parent and sort the path's     
            if (a.id != d.id) return -1;

            // a is not the hovered element, send "a" to the back     
            else return 1; // a is the hovered element, bring "a" to the front     
          });
        })


      //click rects
      legendWrappers.append('rect')
        .attr('width', d => {
          var spacing = 135;
          if (calc.chartWidth < 533) spacing = 110;
          if (calc.chartWidth < 400) spacing = 90;

          return spacing;
        })
        .attr('height', 45)
        .attr('x', -20)
        .attr('y', -18)
        .attr('fill', 'none')
        .attr('pointer-events', 'all')

      //legend rects
      var legendRects = legendWrappers.selectAll('.legend-symbol').data(d => [d]);
      legendRects.exit().remove();
      legendRects = legendRects.enter().append('rect').merge(legendRects);
      legendRects.attr('class', 'legend-symbol')
        .attr('width', 30)
        .attr('height', 15)
        .attr('rx', 7)
        .attr("fill", (d, i) => { return `url(#legGrad${d.id}` })

      //legend texts
      var legendTexts = legendWrappers.selectAll('.legend-text').data((d, i) => [d]);
      legendTexts.exit().remove();
      legendTexts = legendTexts.enter().append('text').merge(legendTexts);
      legendTexts.attr('class', 'legend-text')
        .text(d => d.name.slice(0, 9))
        .attr('fill', (d, i) => d.parentIndex ? attrs.legendRestTextColor : attrs.legendActiveTextColor)
        .attr('x', 35)
        .attr('y', 13)
        .style('text-transform', 'uppercase')
        .attr('font-size', d => {
          console.log(calc.chartWidth)
          if (calc.chartWidth <= 400) return 7;
          if (calc.chartWidth < 533) return 10;

          return 13;
        })





      // ################### function invokations ##################

      run();

      // smoothly handle data updating
      updateData = function () {


      }



      // ####################  FUNCTIONS ###############
      function addDays(date, days) {
        var result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
      }

      function run() {
        behaviors.zoom.translateExtent([[scales.x(calc.min), -Infinity], [scales.x(calc.max), Infinity]]);
        zoomRect.call(behaviors.zoom.transform, d3.zoomIdentity)
      }

      // zoom handler function
      function zoomed() {


        tooltipG.attr('opacity', 0);
        if (d3.event.x > 0) {
          d3.event.transform.x = 0;
        }
        var xz = d3.event.transform.rescaleX(scales.x);
        attrs.currentScale = xz;

        var scrollPosEndDate = xz.invert(calc.chartWidth);
        if (calc.chartWidth < scales.x(scrollPosEndDate)) {
          return;
        }

        var width = container.node().getBoundingClientRect().width;






        var grids = xAxisWrapper.call(axes.x.scale(xz));
        setXAxisStyles();
        setScrollLinePositions(xz);
        svg.selectAll('.area').attr('d', k => {
          if (k.values) {
            k = k.values
          }
          var area = layouts.area.x(v => xz(v.date));
          return area(k);
        })
      }

      //scoll line position update after zoom
      function setScrollLinePositions(newScale) {
        // get date which correspondents chart start
        var scrollPosBeginDate = newScale.invert(0);
        if (scrollPosBeginDate < calc.min) scrollPosBeginDate = calc.min;

        // get date which correspondents chart end
        var scrollPosEndDate = newScale.invert(calc.chartWidth);
        if (scrollPosEndDate > calc.max) scrollPosEndDate = calc.max;
        //get milliseconds of 
        scrollLineActive
          .attr('x1', scales.x(scrollPosBeginDate))
          .attr('x2', scales.x(scrollPosEndDate))
      }

      //x axis styles
      function setXAxisStyles() {
        xAxisWrapper.selectAll('.tick line').attr('stroke', attrs.gridColor)
        xAxisWrapper.selectAll(' .domain').attr('stroke', attrs.gridColor)
        xAxisWrapper.selectAll('.tick text').attr('fill', attrs.axisColor)
          .attr('font-size', 15)
          .attr('y', 23)
      }

      // enter exit update ppattern
      function patternify(params) {
        var container = params.container;
        var selector = params.selector;
        var elementTag = params.elementTag;

        // pattern in action
        var selection = container.selectAll('.' + selector).data([selector])
        selection.exit().remove();
        selection = selection.enter().append(elementTag).merge(selection)
        selection.attr('class', selector);
        return selection;
      }

      if (attrs.firstTime) {
        attrs.firstTime = false;
        setDimensitons();
      }
      d3.select(window).on('resize.area', function () {
        console.log('setting area dimensions');
        setDimensitons();
      })

      function setDimensitons() {
        attrs.data.entities.reverse();
        var outerContainer = container.node();
        var width = outerContainer.getBoundingClientRect().width;

        main.svgWidth(width);
        container.call(main);

      }

    });
  };





  ['svgWidth', 'svgHeight', 'backgroundFill'].forEach(key => {
    // Attach variables to main function
    return main[key] = function (_) {
      var string = `attrs['${key}'] = _`;
      if (!arguments.length) { eval(`return attrs['${key}']`); }
      eval(string);
      return main;
    };
  });




  //exposed update functions
  main.data = function (value) {
    if (!arguments.length) return attrs.data;
    attrs.data = value;
    if (typeof updateData === 'function') {
      updateData();
    }
    return main;
  }


  return main;
}
