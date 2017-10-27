/*
 *  Power BI Visualizations
 *
 *  Copyright (c) Microsoft Corporation
 *  All rights reserved.
 *  MIT License
 *
 *  Permission is hereby granted, free of charge, to any person obtaining a copy
 *  of this software and associated documentation files (the ""Software""), to deal
 *  in the Software without restriction, including without limitation the rights
 *  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 *  copies of the Software, and to permit persons to whom the Software is
 *  furnished to do so, subject to the following conditions:
 *
 *  The above copyright notice and this permission notice shall be included in
 *  all copies or substantial portions of the Software.
 *
 *  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 *  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 *  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 *  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 *  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 *  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 *  THE SOFTWARE.
 */

module powerbi.extensibility.visual {
    import DataView = powerbi.DataView;

    // powerbi.extensibility.utils.type
    import LegendModule = powerbi.extensibility.utils.chart.legend;
    import ILegend = powerbi.extensibility.utils.chart.legend.ILegend;
    import LegendData = powerbi.extensibility.utils.chart.legend.LegendData;
    import LegendDataModule = powerbi.extensibility.utils.chart.legend.data;
    import LegendIcon = powerbi.extensibility.utils.chart.legend.LegendIcon;
    import legendProps = powerbi.extensibility.utils.chart.legend.legendProps;
    import legendPosition = powerbi.extensibility.utils.chart.legend.position;
    import createLegend = powerbi.extensibility.utils.chart.legend.createLegend;
    import LegendPosition = powerbi.extensibility.utils.chart.legend.LegendPosition;

    /**
    * Interface for viewmodel.
    *
    * @interface
    * @property {CategoryDataPoint[]} dataPoints - Set of data points the visual will render.
    */
    interface ViewModel {
        dataPoints: CategoryDataPoint[];  //Check Code: Find way to speficy it as an Array
    };

    /**
     * Interface for data points.
     *
     * @interface
     * @property {string} category          - Corresponding category of data value.
     * @property {ISelectionId} selectionId - Id assigned to data point for cross filtering
     *                                        and visual interaction.
     */
    interface CategoryDataPoint {
        category: string;
        size: number;
        color: number;
        selectionId: ISelectionId;
        hashighlight: boolean;
        rowdata: any;
        legend_value: any;
        legend_color: any
    };

    function contract(path, options, m) {
        let x, y, k;
        let centroid = null
        x = options.width / 2
        y = options.height / 2
        k = 1
        m.transition()
            .duration(450)
            .attr('transform', "translate(" + x + "," + y + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
    }



    function isDataReady(options: VisualUpdateOptions) {
        if (!options
            || !options.dataViews
            || !options.dataViews[0]
            || !options.dataViews[0].categorical
            || !options.dataViews[0].categorical.categories
            || !options.dataViews[0].categorical.categories[0].source) {
            return false;
        }

        return true;
    }
    function visualTransform(options, host, cur_clicked) {

        let dataViews = options.dataViews;
        let categorical = dataViews[0].categorical;
        let hassize = false, hascolor = false
        let tabledata = options.dataViews[0].table.rows

        let size_array = options.dataViews[0].metadata.columns.map(c => c.roles['Size'])
        let color_array = options.dataViews[0].metadata.columns.map(c => c.roles['Color'])

        let size_index = size_array.indexOf(true)
        let color_index = color_array.indexOf(true)

        hassize = size_index > -1 ? true : false
        hascolor = color_index > -1 ? true : false



        let categories = []
        categorical.categories.forEach((category) => {
            categories.push(category)

        })

        let category_length = categories.length - 1
        let geography = cur_clicked;

        if (category_length > 0) {
            geography = categories[category_length - 1].values[0]

        }


        let datavalues = []
        categorical.values.forEach((value) => {
            datavalues.push(value)
        })


        let values = hassize ? hascolor ? datavalues[1] : 0 : datavalues[0]
        let maxvalue = +values.maxLocal
        let minvalue = +values.minLocal
        let centervalue = (maxvalue + minvalue) / 2
        let categoryDataPoints: CategoryDataPoint[] = [];
        let checkhighlight = true
        let highlightvalue = categorical.values[0].highlights;
        let objects = dataViews[0].metadata.objects;
        let haslegend = false

        let legendData: LegendData = {
            fontSize: 10,
            dataPoints: [],
            title: 'Legend'
        };

        let legend_array = options.dataViews[0].metadata.columns.map(c => c.roles['Legend'])
        if (legend_array.indexOf(true) > -1) {
            haslegend = true
        }

        let legend_index = legend_array.indexOf(true)
        let _ = (<any>window)._
        let colorPalette: IColorPalette = host.colorPalette;
        let ldata = []

        let legend_data = null, temp_legend
        legend_data = options.dataViews[0].table.rows.map(c => c[legend_index])

        if (haslegend) {
            legend_data = options.dataViews[0].table.rows.map(c => c[legend_index])
            temp_legend = legend_data
            legend_data = _.uniq(legend_data)
            legend_data.forEach(function (i, d) {
                let defaultColor: Fill = {
                    solid: {
                        color: colorPalette.getColor(d + '').value
                    }
                }
                ldata.push({
                    label: i,
                    color: getCategoricalObjectValue<Fill>(categories[0], d, 'ordinalcolors', 'datacolor', defaultColor).solid.color,
                    identity: host.createSelectionIdBuilder()
                        .withCategory(categories[0], d)
                        .createSelectionId(),
                    icon: LegendIcon.Box,
                    selected: false,
                })
            })
        }

        legendData.dataPoints = ldata;


        for (let i = 0, len = categories[category_length].values.length; i < len; i++) {

            if (highlightvalue != undefined) {
                checkhighlight = highlightvalue[i] !== null ? true : false;
            }
            let legend = ldata.length !== 0 ? ldata.filter(ld => ld.label === temp_legend[i]) : null
            categoryDataPoints.push({
                category: categories[category_length].values[i],
                size: hassize ? datavalues[0].values[i] : null,
                color: hassize ? hascolor ? datavalues[1].values[i] : null : datavalues[0].values[i],
                selectionId: host.createSelectionIdBuilder()
                    .withCategory(categories[0], i)
                    .createSelectionId(),
                hashighlight: checkhighlight,
                rowdata: tabledata[i],
                legend_value: legend != null ? legend[0].value : null,
                legend_color: legend != null ? legend[0].color : null,
            })


        }

        let settings = {
            mincolor: {
                solid: {
                    color: 'red'
                }
            },
            maxcolor: {
                solid: {
                    color: 'green'
                }
            },
            centercolor: {
                solid: {
                    color: 'yellow'
                }
            },
            strokecolor: {
                solid: {
                    color: 'black'
                }
            },
            circlestroke: {
                solid: {
                    color: 'black'
                }
            },
            mapcolor: {
                solid: {
                    color: '#ccc'
                }
            },
            circlecolor: {
                solid: {
                    color: '#000'
                }
            },
            legend_color: {
                solid: {
                    color: "#666666"
                }
            }
        }

        let defaultprojection = 'Mercator'
        let projection = getValue<string>(objects, 'countryselector', 'projection', defaultprojection)


        let zoomsettings = {
            autozoom_enable: getValue<boolean>(objects, 'zoomselector', 'Autozoom', false),
            selectionzoom_enable: getValue<boolean>(objects, 'zoomselector', 'Selectionzoom', true),
            manualzoom_enable: getValue<boolean>(objects, 'zoomselector', 'Manualzoom', false)

        }

        let legend = {
            show: getValue<boolean>(objects, 'legendproperties', 'show', true),
            showTitle: getValue<boolean>(objects, 'legendproperties', 'title', true),
            labelColor: getValue<Fill>(objects, 'legendproperties', 'color', settings.legend_color)['solid']['color'],
            position: getValue<string>(objects, 'legendproperties', 'position', 'top'),
            fontSize: getValue<number>(objects, 'legendproperties', 'fontsize', 10)
        }


        return {
            dataPoints: categoryDataPoints,
            legenddata: legendData,
            settings: {
                hashighlights: highlightvalue,
                haslegend: haslegend,
                hascolor: hascolor,
                hassize: hassize,
                min_color: getValue<Fill>(objects, 'categorycolorselector', 'mincolor', settings.mincolor)['solid']['color'],
                max_color: getValue<Fill>(objects, 'categorycolorselector', 'maxcolor', settings.maxcolor)['solid']['color'],
                center_color: getValue<Fill>(objects, 'categorycolorselector', 'centercolor', settings.centercolor)['solid']['color'],
                min_value: getValue<number>(objects, 'categorycolorselector', 'minvalue', minvalue),
                center_value: getValue<number>(objects, 'categorycolorselector', 'centervalue', centervalue),
                max_value: getValue<number>(objects, 'categorycolorselector', 'maxvalue', maxvalue),

                projection: projection,

                custom_level0: getValue<string>(objects, 'countryselector', 'level0', null),
                custom_level1: getValue<string>(objects, 'countryselector', 'level1', null),
                custom_level2: getValue<string>(objects, 'countryselector', 'level2', null),

                id0: getValue<string>(objects, 'countryselector', 'id0', null),
                id1: getValue<string>(objects, 'countryselector', 'id1', null),
                id2: getValue<string>(objects, 'countryselector', 'id2', null),

                map_color: getValue<Fill>(objects, 'defaultSelector', 'mapcolor', settings.mapcolor)['solid']['color'],
                circle_color: getValue<Fill>(objects, 'defaultSelector', 'circlecolor', settings.circlecolor)['solid']['color'],


                circle_size: getValue<number>(objects, 'circlesettings', 'size', 30),
                circle_border: getValue<number>(objects, 'circlesettings', 'border', 0),
                circle_transparency: getValue<number>(objects, 'circlesettings', 'transparency', 0),
                circle_stroke: getValue<Fill>(objects, 'circlesettings', 'color', settings.circlestroke)['solid']['color'],



                stroke_width: getValue<number>(objects, 'defaultSelector', 'width', 1),
                stroke_color: getValue<Fill>(objects, 'defaultSelector', 'strokecolor', settings.strokecolor)['solid']['color'],


                geography_clicked: geography,
                path_enable: getValue<boolean>(objects, 'defaultSelector', 'path', true),

                zoomsettings: zoomsettings,

                legend: legend,
                legend_show: getValue<boolean>(objects, 'ordinalcolors', 'legend', true),

                collision_enable: getValue<boolean>(objects, 'collisionselector', 'show', true)
            }
        }

    }
    function normalize_stroke(cur_level, geography, width) {

        if (geography != 'default') {
            return width / (cur_level + 1)
        }

        return width

    }

    export class Visual implements IVisual {

        private target: HTMLElement;
        private updateCount: number;
        private margin = { top: 20, right: 20, bottom: 40, left: 20 };
        private svg: d3.Selection<SVGElement>;
        private levelStack;
        private projection;
        private path;
        private viewModel: ViewModel;
        private selectionManager: ISelectionManager;
        private tooltipServiceWrapper: ITooltipServiceWrapper;
        private host;
        private settings;

        private data;
        private legend_data;
        private legend: ILegend;
        private layout;

        private static clicked;
        private static previous_clicked;
        private static previous_transform;
        private current_Event;
        private static previous_level;

        private circles;
        private nodes;
        private rect;
        private coptions


        private renderLegend(): void {
            // Force update for title text
            let legendObject = _.clone(this.settings.legend);

            legendObject.labelColor = <any>{ solid: { color: legendObject.labelColor } };


            LegendDataModule.update(this.legend_data, <any>legendObject);

            let position: string = legendPosition[this.settings.legend.position] as string;

            this.legend.changeOrientation(LegendPosition[position]);

            this.legend.drawLegend(this.legend_data, this.layout);
            LegendModule.positionChartArea(this.svg, this.legend);

        }

        constructor(options: VisualConstructorOptions) {
            var captionArea = document.createElement("div");
            // captionArea.innerHTML = "This is test chart";
            options.element.appendChild(captionArea);
            this.target = document.createElement("div");
            options.element.appendChild(this.target);
            this.levelStack = [];
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            this.tooltipServiceWrapper = createTooltipServiceWrapper(this.host.tooltipService, options.element);
            let svg = this.svg = d3.select(options.element)
                .append('svg')
                .classed('map', true)
                .attr("preserveAspectRatio", "xMidYMid meet")
                .style("position", "absolute");

            this.legend = createLegend(
                $(options.element),
                options.host && false,
                undefined,
                true);

            this.coptions = options

            Visual.clicked = 'default';
            Visual.previous_clicked = 'default';
            this.current_Event = 'drillup'

        }

        public update(options: VisualUpdateOptions) {
            if (isDataReady(options) == false) {
                this.svg.selectAll('*').remove()
                d3.select('#legendGroup').selectAll('*').remove()
                d3.selectAll('.error').remove()
                return;
            }

            d3.selectAll('.error').remove()

            var temp = options.dataViews[0].metadata.columns;
            var temp_indexes = []
            var temp_ii = []
            _.each(temp, (v, i) => {
                if (v.roles['category']) {
                    temp_indexes.push(v.displayName)
                    temp_ii.push(i)
                }
            })

            let cur_level;
            var temp_sources = options.dataViews[0].matrix.rows.levels[0].sources.filter(s => temp_indexes.indexOf(s.identityExprs[0]['ref']) > -1)
            if (temp_sources.length > 1) {
                cur_level = temp_sources.length - 1
            } else {
                cur_level = temp_sources[0].index - temp_ii[0]
            }


            if (temp_sources.length > 1) {

                let index = options.dataViews[0].matrix.rows.root.childIdentityFields.map(s => s['ref']).indexOf(temp_indexes[temp_sources.length - 2])

                Visual.clicked = options.dataViews[0].matrix.rows.root.children[0].levelValues[index].value

            }


            if (cur_level < Visual.previous_level) {

                this.current_Event = 'drillup'
                this.selectionManager.clear()
                if (temp_sources.length === 1)
                    Visual.clicked = Visual.previous_clicked
            }

            else if ((cur_level > Visual.previous_level) && Visual.clicked != 'default') {

                this.current_Event = 'drilldown'
            }

            Visual.previous_level = cur_level

            let viewModel = this.viewModel = visualTransform(options, this.host, Visual.clicked);
            let selectionManager = this.selectionManager;
            let allowInteractions = this.host.allowInteractions;
            let settings = this.settings = viewModel.settings;
            let data = this.data = viewModel.dataPoints;

            Visual.clicked = settings.geography_clicked

            if ((settings.custom_level0 === null || settings.custom_level0 === '') && (settings.custom_level1 || settings.custom_level2)) {
                this.svg.selectAll('*').remove()

                this.append_error(this.coptions, this.layout, '', 'Specify level 1 JSON')
                return;
            }

            if ((settings.custom_level1 === null || settings.custom_level1 === '') && settings.custom_level2) {
                this.svg.selectAll('*').remove()

                this.append_error(this.coptions, this.layout, '', 'Specify level 2 JSON')
                return;
            }


            let legend_data = this.legend_data = viewModel.legenddata;

            let projection_choice = [
                { name: 'albersUSA', projection: d3.geo.albersUsa() },
                { name: 'Equirectangular', projection: d3.geo.equirectangular() },
                { name: 'Orthographic', projection: d3.geo.orthographic() },
                { name: 'Mercator', projection: d3.geo.mercator() },
                { name: 'albers', projection: d3.geo.albers() }
            ]
            let pc = projection_choice.filter(function (p) {
                if (p.name === settings.projection) //TODO: get this from options
                    return true
            })[0];

            this.layout = { height: options.viewport.height, width: options.viewport.width }

            let svg = this.svg;
            //svg.attr("viewBox", "0 0 " + options.viewport.width + " " + options.viewport.height)


            this.settings.legend_show ? this.renderLegend() : d3.select('#legendGroup').selectAll('*').remove()

            svg.selectAll('*').remove()

            this.projection = pc.projection;
            this.path = d3.geo.path()
                .projection(this.projection);
            this.projection
                .scale(1)
                .translate([0, 0])

            this.updateViewport()

            svg.attr({
                height: this.layout.height,
                width: options.viewport.width
            })


            let rect = this.rect = svg.append("rect")
                .attr("width", this.layout.width)
                .attr("height", this.layout.height)

            let m = svg.append('g')

            var zoom = d3.behavior.zoom()
                .translate([0, 0])
                .scale(1)
                .scaleExtent([1, 20])
                .on("zoom", function () {
                    m.attr("transform", "translate(" + d3.event['translate'] + ")scale(" + d3.event['scale'] + ")");
                });
            if (this.settings.zoomsettings.manualzoom_enable) {
                svg
                    .call(zoom) // delete this line to disable free zooming
                    .call(zoom.event);
            } else {
                svg.call(zoom.event);
            }


            // let gHeight = this.layout.height
            //  - this.margin.top
            //  - this.margin.bottom;
            // let gWidth = this.layout.height
            //  - this.margin.right
            //  - this.margin.left;

            m.attr({
                height: this.layout.height,
                width: this.layout.width

            });


            let path = this.path;
            let projection = this.projection;

            if (cur_level === 0) {

                Visual.clicked = 'default'
            }

            else if (cur_level === 1) {
                Visual.previous_clicked = Visual.clicked
            }

            this.drawmap(
                svg,
                m,
                projection,
                path, options,
                Visual.clicked,
                cur_level,
                selectionManager,
                viewModel,
                allowInteractions,
                Visual,
                this.tooltipServiceWrapper,
                zoom
            )

        }
        private updateViewport(): void {
            let legendMargins: IViewport = this.legend.getMargins(),
                position: any



            position = LegendPosition[legendPosition[this.settings.legend.position] as string];
            switch (position) {
                case LegendPosition.Top:
                case LegendPosition.TopCenter:
                case LegendPosition.Bottom:
                case LegendPosition.BottomCenter: {
                    this.layout.height = this.layout.height - legendMargins.height

                    break;
                }
                case LegendPosition.Left:
                case LegendPosition.LeftCenter:
                case LegendPosition.Right:
                case LegendPosition.RightCenter: {
                    this.layout.width = this.layout.width - legendMargins.width

                    break;
                }
            }
        }

        private static getTooltipData(value: any, cols: any): VisualTooltipDataItem[] {

            var tooltips = []

            if (value.data != null) {
                var zip = rows => rows[0].map((_, c) => rows.map(row => row[c]))
                var tooltipdata = zip([cols, value.rowdata])
                tooltipdata.forEach((t) => {
                    var temp = {}
                    temp['displayName'] = t[0]
                    temp['value'] = `${t[1]}`
                    tooltips.push(temp)
                })
            } else {
                tooltips.push({ 'displayName': 'No Data' })
            }
            return tooltips;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];
            let settings = this.settings;
            let data = this.data;
            switch (objectName) {
                case 'categorycolorselector':
                    if (!settings.haslegend)
                        objectEnumeration.push({
                            objectName: objectName,
                            properties: {
                                mincolor: {
                                    solid: {
                                        color: settings.min_color
                                    }
                                },
                                centercolor: {
                                    solid: {
                                        color: settings.center_color
                                    }
                                },
                                maxcolor: {
                                    solid: {
                                        color: settings.max_color
                                    }
                                },
                                minvalue: settings.min_value,
                                centervalue: settings.center_value,
                                maxvalue: settings.max_value
                            },
                            selector: null
                        })
                    break;

                case 'countryselector':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {

                            projection: settings.projection,

                            level0: settings.custom_level0,
                            level1: settings.custom_level1,
                            level2: settings.custom_level2,
                            id0: settings.id0,
                            id1: settings.id1,
                            id2: settings.id2,
                        },
                        selector: null
                    })
                    break;

                case 'legendproperties':
                    if (settings.haslegend)
                        objectEnumeration.push({
                            objectName: objectName,
                            properties: {
                                show: settings.legend.show,
                                position: settings.legend.position,
                                title: settings.legend.showTitle,
                                color: settings.legend.labelColor,
                                fontsize: settings.legend.fontSize
                            },
                            validValues: {
                                fontsize: {
                                    numberRange: {
                                        min: 8,
                                        max: 40
                                    }
                                }
                            },
                            selector: null
                        })
                    break

                case 'defaultSelector':
                    objectEnumeration.push({
                        objectName: objectName,
                        displayName: 'Default Colors',
                        properties: {
                            path: settings.path_enable,
                            mapcolor: {
                                solid: {
                                    color: settings.map_color
                                }
                            },
                            circlecolor: {
                                solid: {
                                    color: settings.circle_color
                                }
                            },
                            width: settings.stroke_width,

                            strokecolor: {
                                solid: {
                                    color: settings.stroke_color
                                }
                            },
                        },
                        validValues: {
                            width: {
                                numberRange: {
                                    min: 0.0,
                                    max: 4.0
                                }
                            }
                        },
                        selector: null

                    });
                    break;


                case 'circlesettings':

                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            size: settings.circle_size,
                            color: settings.circle_stroke,
                            border: settings.circle_border,
                            transparency: settings.circle_transparency
                        },
                        selector: null,
                        validValues: {
                            size: {
                                numberRange: {
                                    min: 2.0,
                                    max: 100.0
                                }
                            },
                            border: {
                                numberRange: {
                                    min: 0.0,
                                    max: 10.0
                                }
                            },
                            transparency: {
                                numberRange: {
                                    min: 0.0,
                                    max: 1.0
                                }
                            }
                        }

                    })

                    break;


                case 'ordinalcolors':
                    for (let d of this.legend_data.dataPoints) {
                        objectEnumeration.push({
                            objectName: objectName,
                            properties: {
                                datacolor: {
                                    solid: {
                                        color: d.color
                                    }
                                }
                            },
                            displayName: d.label + "",
                            selector: d.identity.getSelector()
                        })

                    }
                    break;

                case "zoomselector":
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            Autozoom: settings.zoomsettings.autozoom_enable,
                            Selectionzoom: settings.zoomsettings.selectionzoom_enable,
                            Manualzoom: settings.zoomsettings.manualzoom_enable
                        },
                        selector: null
                    })

                    break

                case "collisionselector":
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            show: settings.collision_enable
                        },
                        selector: null
                    })

                    break

            }

            return objectEnumeration

        }

        public drawmap(svg, m, projection, path, options, geography, cur_level, selectionManager, viewModel, allowInteractions, Visual, tooltipServiceWrapper, zoom) {

            let tjson = (<any>window).topojson
            let _ = (<any>window)._


            let data = viewModel.dataPoints;
            let settings = viewModel.settings

            let sizevalues = data.map((d) => {
                if (d.size !== null) {
                    return d.size
                }
            })

            let colorvalues = data.map(d => d.color)


            var _domain = d3.extent(sizevalues);
            var min_scale = 0.05;
            var domain_spread = Math.sqrt(_domain[1] - Math.sqrt(_domain[0]))
            _domain[0] = Math.pow(Math.sqrt(_domain[0]) - domain_spread * min_scale, 2)

            let radius = d3.scale.sqrt()
                .domain(_domain);

            let chorocolors = d3.scale.linear()
                .domain([settings.min_value, settings.center_value, settings.max_value])
                .range([settings.min_color, settings.center_color, settings.max_color])


            let force = d3.layout.force()
                .charge(0)
                .gravity(0)
                .size([this.layout.width, this.layout.height]);


            let level_classes = { 0: 'level_0', 1: 'level_1', 2: 'level_2' }
            let cur_border, topojson, t;


            let clevel0 = settings.custom_level0 != '' ? settings.custom_level0 : null
            let clevel1 = settings.custom_level1 != '' ? settings.custom_level1 : null
            let clevel2 = settings.custom_level2 != '' ? settings.custom_level2 : null

            let id0 = settings.id0 != '' ? settings.id0 : null
            let id1 = settings.id1 != '' ? settings.id1 : null
            let id2 = settings.id2 != '' ? settings.id2 : null


            let custom_shapes = {
                country: 'Custom',
                level_0: clevel0,
                level_1: clevel1,
                level_2: clevel2
            }

            let custom_id = {
                level_0: id0,
                level_1: id1,
                level_2: id2
            }

            let country_topojson = [custom_shapes][0]
            let id = [custom_id][0][level_classes[cur_level]]

            projection
                .scale(1)
                .translate([0, 0])

            let rect = this.rect

            // temp
            topojson = country_topojson[level_classes[cur_level]]

            let current_Event = this.current_Event;
            let expand = this.expand
            let expand_border = this.expand_border
            let layout = this.layout
            let append_error = this.append_error
            let coptions = this.coptions

            // Remove all previous shapes


            let tick = this.tick
            let gravity = this.gravity
            let collide = this.collide
            if (topojson != null) {

                d3.json(topojson, function (err, maps) {

                    if (err) {
                        append_error(coptions, layout, err, 'INVALID JSON FILE')
                        return console.warn(err);
                    }

                    // If we have multiple objects, it's an invalid topojson file. Fix it
                    if (d3.values(maps.objects).length > 0) {
                        var geometries = d3.values(maps.objects)
                            .filter(function (v) { return v['type'] == 'GeometryCollection' })
                            .map(function (v) { return v['geometries'] })
                        maps.objects = {
                            'shape': {
                                geometries: Array.prototype.concat.apply([], geometries),
                                type: 'GeometryCollection'
                            }
                        }
                    }

                    let map_features = tjson.feature(maps, d3.values(maps.objects)[0]).features
                    let allkeys = [], key

                    if (id != null) {
                        map_features.map((b) => {
                            if (!b['properties'][id] && b[id])
                                b['properties'] = { id: b[id] }

                        })
                    }
                    if (cur_level > 0 && geography !== 'default') {
                        map_features.filter(function (d) {
                            let properties = d.properties

                            for (var keys in properties) {
                                if (String(properties[keys]) === String(geography)) {
                                    allkeys.push(keys)
                                }
                            }
                        })
                        key = _.chain(allkeys).countBy().toPairs().max(_.last).head().value()
                    }

                    // Filter maps based on selected geography | Default: Entire level wise map
                    let cur_border = geography != 'default' ? map_features.filter(function (d) {
                        if (cur_level == 1) {
                            var _key = custom_id['level_0'] != null ? custom_id['level_0'] : key;
                            return String(d.properties[_key]) === String(geography)
                        } else if (cur_level == 2) {
                            var _key = custom_id['level_1'] != null ? custom_id['level_1'] : key;
                            return String(d.properties[_key]) === String(geography)
                        } else {
                            return true;
                        }
                    }) : map_features

                    var b = path.bounds({ "type": "FeatureCollection", "features": map_features }),
                        s = 1 / Math.max((b[1][0] - b[0][0]) / layout.width, (b[1][1] - b[0][1]) / layout.height);
                    projection
                        .scale(s)
                        .translate([(layout.width - s * (b[1][0] + b[0][0])) / 2, (layout.height - s * (b[1][1] + b[0][1])) / 2])


                    var map_data = cur_border.map((cb) => {

                        // Remove previous level key pair
                        // Eg: if Hawaii is state name and we have "hawaii" as county name as well
                        // remove state level hawaii from temp dict
                        var _temp_props = cb.properties
                        if (key != undefined && cur_level > 0) {
                            delete _temp_props[key]
                        }

                        // var this_shape_props = _.values(cb.properties)
                        var this_shape_props = _.values(_temp_props)

                        // Convert all properties value to string
                        // Users may not be aware of ont to string matching
                        this_shape_props = this_shape_props.map(sp => String(sp))

                        var this_shape = data.filter(df => this_shape_props.indexOf(String(df.category)) > -1)

                        if (settings.haslegend) {
                            let key = settings.hascolor ? 'color' : settings.hassize ? 'size' : null

                            if (key != null) {
                                let max_value = d3.max(this_shape.map(ts => ts[key]))
                                if (max_value)
                                    this_shape = this_shape.filter(df => df[key] === max_value)
                            }
                        }
                        if (this_shape.length > 0) {
                            cb['data'] = this_shape[0]
                            cb['settings'] = settings

                        } else {
                            cb['data'] = null
                            cb['settings'] = settings
                        }
                        return cb
                    })

                    let mapshapes = m.selectAll('g')
                        .data(map_data)
                        .enter()
                        .append('g')
                        .attr('class', 'map-grpup')
                        .attr('stroke', d => d.settings.stroke_color)
                        .attr('stroke-width', d => d.settings.stroke_width / 2 + 'px');


                    if (settings.path_enable) {
                        mapshapes.append('path')
                            .attr("d", path)
                            .attr("class", level_classes[cur_level])
                            .attr('fill', settings.map_color)
                            .attr('vector-effect', 'non-scaling-stroke');
                    }


                    //  Get zoom level -> used to normalize circles
                    var _bounds = path.bounds({ 'type': 'FeatureCollection', 'features': cur_border }),
                        _dx = _bounds[1][0] - _bounds[0][0],
                        _dy = _bounds[1][1] - _bounds[0][1],
                        _scale = Math.max(1, Math.min(20, 1 / Math.max(_dx / layout.width, _dy / layout.height)));


                    // Update radius range
                    var _nodes = Math.max(10, map_data.length)
                    var _max_radius = (settings.circle_size * 6) / Math.pow(_nodes, 1 / 2.2) / _scale
                    radius.range([0, _max_radius]);

                    let nodes = cur_border.filter(function (d, i) {
                        return d.data
                    }).map(function (d, i) {
                        var _r = _domain[0] == _domain[1] ? _max_radius : radius(d.data.size)
                        // var _r = radius(d.data.size)
                        var point = path.centroid(d.geometry)
                        return (typeof point === 'undefined') ? { x: 0, y: 0 } : {
                            type: 'feature',
                            geometry: d.geometry,
                            properties: d.properties,
                            x: point[0],
                            y: point[1],
                            x0: point[0],
                            y0: point[1],
                            r: _r,
                            selectionId: d.data !== null ? d.data.selectionId : null,
                            hashighlight: d.data != null ? d.data.hashighlight : null,
                            color: d.data != null ? d.data.color : null,
                            rowdata: d.data != null ? d.data.rowdata : null,
                            data: d.data,
                            settings: settings

                        }
                    })

                    let shapes = []

                    let circles = m.selectAll('.circle-' + cur_level).data(nodes)

                    circles.enter()
                        .append('circle')
                        .attr('r', function (d) {
                            return d['r'];
                        })
                        .attr("class", (d) => {
                            if (settings.zoomsettings.autozoom_enable) {

                                if (d.data != null && settings.hashighlights != undefined && d.data.hashighlight) {
                                    shapes.push(d)
                                }

                                //d.data != null ? settings.hashighlights != undefined && d.data.hashighlight ? expand(path, d, layout, m, cur_level, zoom, settings, current_Event) : null : null

                            }
                            return "circles-" + level_classes[cur_level]
                        })
                        .attr('cx', d => d['x'])
                        .attr('cy', d => d['y'])
                        .attr('fill', (d) => {
                            return d.data !== null ? settings.haslegend ? d.data.legend_color : d.color ? chorocolors(d.color) : settings.circle_color : settings.circle_color
                        })
                        .attr('stroke', d => d.settings.circle_stroke)
                        .attr('stroke-width', d => d.settings.circle_border / 2 + 'px')
                        .attr('opacity', d => 1 - (d.settings.circle_transparency / 100))
                        .attr('vector-effect', 'non-scaling-stroke');


                    circles.on('click', function (d) {

                        if (d.data != null) {


                            if (settings.zoomsettings.selectionzoom_enable && (settings.hashighlights === undefined || d.data.hashighlight))
                                expand(path, d, layout, m, cur_level, zoom, settings, current_Event)

                            Visual.clicked = d.data != null ? d.data.category : Visual.clicked

                            if (d !== null && allowInteractions && settings.hashighlights === undefined && (settings.hashighlights === undefined || d.data.hashighlight)) {
                                selectionManager.select(d.selectionId).then((ids: ISelectionId[]) => {
                                    let stroke_width = d.settings.stroke_width;
                                    circles.attr({
                                        'fill-opacity': ids.length > 0 ? 0.2 : 1
                                    });


                                    d3.select(this).attr({
                                        'fill-opacity': 1
                                    });

                                    if (ids.length <= 0 && settings.zoomsettings.selectionzoom_enable) {
                                        Visual.clicked = 'default'
                                        if (geography !== 'default')
                                            expand_border(path, { 'type': 'FeatureCollection', 'features': cur_border }, layout, m, cur_level, zoom, settings, current_Event)
                                        else
                                            contract(path, layout, m)
                                    }
                                });
                                (<Event>d3.event).stopPropagation();
                            }
                        }
                    })

                    circles.attr('fill-opacity', (d) => {
                        if (d !== null) {
                            return d.hashighlight ? 1 : 0.2
                        } else {
                            return 1
                        }
                    })

                    let curcols = options.dataViews[0].metadata.columns.map(c => c.displayName)

                    tooltipServiceWrapper.addTooltip(circles,
                        (tooltipEvent: TooltipEventArgs<number>) => Visual.getTooltipData(tooltipEvent.data, curcols),
                        (tooltipEvent: TooltipEventArgs<number>) => null);

                    if (settings.collision_enable) {

                        this.circles = circles;
                        this.nodes = nodes
                        force
                            .nodes(this.nodes)
                            .on("tick", (e) => { tick(gravity, collide, e) })
                            .start();
                    }

                    rect.on('click', function (d) {
                        circles.attr({
                            'fill-opacity': 1
                        });
                        selectionManager.clear()
                        expand_border(path, { 'type': 'FeatureCollection', 'features': cur_border }, layout, m, cur_level, zoom, settings, current_Event)
                    });


                    //for zooming to all selected shapes
                    if (settings.hashighlights != undefined && settings.zoomsettings.autozoom_enable && shapes.length > 0) {

                        expand_border(path, { 'type': 'FeatureCollection', 'features': shapes }, layout, m, cur_level, zoom, settings, 'drillup')
                    }

                    else if (geography !== 'default') {
                        expand_border(path, { 'type': 'FeatureCollection', 'features': cur_border }, layout, m, cur_level, zoom, settings, current_Event)
                    }
                })
            }
        }

        /* Function to zoom on selected geography */
        private expand(path, cur_border, options, m, cur_level, zoom, settings, cur_Event) {


            var bounds = path.bounds(cur_border.geometry),

                dx = Math.max(cur_border.x, bounds[0][0], bounds[1][0]) - Math.min(cur_border.x, bounds[0][0], bounds[1][0]),
                dy = Math.max(cur_border.y, bounds[0][1], bounds[1][1]) - Math.min(cur_border.y, bounds[0][1], bounds[1][1]),
                _x = (Math.max(cur_border.x, bounds[0][0], bounds[1][0]) + Math.min(cur_border.x, bounds[0][0], bounds[1][0])) / 2,
                _y = (Math.max(cur_border.y, bounds[0][1], bounds[1][1]) + Math.min(cur_border.y, bounds[0][1], bounds[1][1])) / 2,
                scale = Math.max(1, Math.min(20, 0.9 / Math.max(dx / options.width, dy / options.height))),
                // scale = .9 / Math.max(dx / options.viewport.width, dy / options.viewport.height),
                translate = [options.width / 2 - scale * _x, options.height / 2 - scale * _y];

            if (settings.zoomsettings.manualzoom_enable) {
                if (cur_Event === 'drillup' && Visual.previous_transform)
                    m.attr('transform', Visual.previous_transform)
                m.transition()
                    .duration(750)
                    .attr('transform', 'translate(' + translate + ')scale(' + scale + ')')
                    .call(zoom.translate(translate).scale(scale).event);

                Visual.previous_transform = "translate(" + translate + ")scale(" + scale + ")"
            } else {
                if (cur_Event === 'drillup' && Visual.previous_transform)
                    m.attr('transform', Visual.previous_transform)

                m.transition()
                    .duration(750)
                    .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

                Visual.previous_transform = "translate(" + translate + ")scale(" + scale + ")"
            }
        }




        private expand_border(path, cur_border, options, m, cur_level, zoom, settings, cur_Event) {
            var bounds = path.bounds(cur_border),
                dx = bounds[1][0] - bounds[0][0],
                dy = bounds[1][1] - bounds[0][1],
                _x = (bounds[0][0] + bounds[1][0]) / 2,
                _y = (bounds[0][1] + bounds[1][1]) / 2,
                scale = Math.max(1, Math.min(20, 0.9 / Math.max(dx / options.width, dy / options.height))),
                // scale = .9 / Math.max(dx / options.viewport.width, dy / options.viewport.height),
                translate = [options.width / 2 - scale * _x, options.height / 2 - scale * _y];

            if (settings.zoomsettings.manualzoom_enable) {
                if (cur_Event === 'drillup' && Visual.previous_transform)
                    m.attr('transform', Visual.previous_transform)
                m.transition()
                    .duration(750)
                    .attr('transform', 'translate(' + translate + ')scale(' + scale + ')')
                    .call(zoom.translate(translate).scale(scale).event);

                Visual.previous_transform = "translate(" + translate + ")scale(" + scale + ")"
            } else {
                if (cur_Event === 'drillup' && Visual.previous_transform)
                    m.attr('transform', Visual.previous_transform)

                m.transition()
                    .duration(750)
                    .attr("transform", "translate(" + translate + ")scale(" + scale + ")");

                Visual.previous_transform = "translate(" + translate + ")scale(" + scale + ")"
            }
        }

        public tick(gravity, collide, e) {
            this.circles.each(gravity(e.alpha * .1))
                .each(collide(.5))
                .attr("cx", function (d) { return d.x; })
                .attr("cy", function (d) { return d.y; });
        }

        public gravity(k) {
            return function (d) {
                d.x += (d.x0 - d.x) * k;
                d.y += (d.y0 - d.y) * k;
            };
        }

        public collide(k) {
            var q = d3.geom.quadtree(this.nodes);
            return function (node) {
                var nr = node.r + 1,
                    nx1 = node.x - nr,
                    nx2 = node.x + nr,
                    ny1 = node.y - nr,
                    ny2 = node.y + nr;
                q.visit(function (quad, x1, y1, x2, y2) {
                    if (quad.point && (quad.point !== node)) {
                        var x = node.x - quad.point['x'],
                            y = node.y - quad.point['y'],
                            l = x * x + y * y,
                            r = nr + quad.point['r'];
                        if (l < r * r) {
                            l = ((l = Math.sqrt(l)) - r) / l * k;
                            node.x -= x *= l;
                            node.y -= y *= l;
                            quad.point['x'] += x;
                            quad.point['y'] += y;
                        }
                    }
                    return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
                });
            };
        }

        public append_error(options, layout, err, err_message) {

            let error = d3.select(options.element)
                .append('svg')
                .attr('class', 'error')
                .attr('width', layout.width)
                .attr('height', layout.height)
                .style('position', 'absolute')


            let rect = error.append('rect')
                .attr('width', layout.width)
                .attr('height', layout.height / 4)
                .attr('class', 'error-rect')
                .attr('y', layout.height / 3)

            let t = error.append('text')
                .attr('x', layout.width / 4)
                .attr('y', layout.height / 2.2)
                .attr("dy", ".65em")

            t.append('tspan')
                .text(err_message)
                .attr('x', layout.width / 3.7)
                .attr('y', layout.height / 2.3)

            t.append('tspan')
                .text(err.responseText)
                .attr('x', layout.width / 4)
                .attr('y', layout.height / 2.0)
        }
    }
}
