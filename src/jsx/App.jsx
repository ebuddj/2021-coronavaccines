import React, {Component} from 'react'
import style from './../styles/styles.less';

// https://underscorejs.org/
import _ from 'underscore';

// https://github.com/topojson/topojson
import * as topojson from 'topojson-client';

// https://d3js.org/
import * as d3 from 'd3';

import constants from './Constants.jsx';
import languages from './Languages.jsx';

let interval, g, path;

function getHashValue(key) {
  let matches = location.hash.match(new RegExp(key+'=([^&]*)'));
  return matches ? matches[1] : null;
}

const l = languages[getHashValue('l') ? getHashValue('l') : 'en'];

// https://github.com/d3/d3-geo-projection
const projection = d3.geoEqualEarth().center([-5,18]).scale(240);
const data_file_name = 'data - data.csv';

class App extends Component {
  constructor(props) {
    super(props);
    
    this.state = {
      data:{},
      id:-1,
      name:'',
      type:'',
      developer:'',
      origin:''
    }
  }
  componentDidMount() {
    d3.csv('./data/' + data_file_name).then((data) => {
      this.setState((state, props) => ({
        data:data
      }), this.drawMap);
    })
    .catch(function (error) {
    })
    .then(function () {
    });
  }
  drawMap() {
    let width = 1150;
    let height = 600;
    
    let svg = d3.select('.' + style.map_container).append('svg').attr('width', width).attr('height', height);
    path = d3.geoPath().projection(projection);
    g = svg.append('g');

    let tooltip = d3.select('.' + style.map_container)
      .append('div')
      .attr('class', style.hidden + ' ' + style.tooltip);
    d3.json('./data/countries-110m.topojson').then((topology) => {
      const features = topojson.feature(topology, topology.objects.countries).features
      g.selectAll('path').data(features)
        .enter().append('path')
        .attr('d', path)
        .attr('class', style.path)
        .style('stroke', (d, i) => {
          return this.getAreaStroke(d.properties.name);
        })
        .attr('fill', (d, i) => {
          return this.getAreaFill(d.properties.name);
        });

      g.selectAll('.centroid').data(constants.country_data)
        .enter().append('circle')
        .attr('class', 'centroid')
        .attr('fill', '#f00')
        .attr('stroke', '#f00')
        .attr('stroke-width', 0)
        .attr('r', 0)
        .attr('cx', (d) => {
          return projection([d.lng, d.lat])[0];
        })
        .attr('cy', (d) => {
          return projection([d.lng, d.lat])[1];
        });

        // g.selectAll('.centroid').data(features.map((feature) => { return { location:path.centroid(feature), name:feature.properties.name } });)
        //   .enter().append('circle')
        //   .attr('class', 'centroid')
        //   .attr('fill', '#f00')
        //   .attr('stroke', '#f00')
        //   .attr('stroke-width', 0)
        //   .attr('r', 0)
        //   .attr('cx', (d) => {
        //     return d.location[0];
        //   })
        //   .attr('cy', (d) => {
        //     return d.location[1]
        //   });
    });
    setTimeout(() => {
      this.createInterval();
    }, 1000);
  }
  getAreaStroke(area) {
    return (area !== 'Antarctica' && area !== 'Fr. South Antarctic Lands') ? '#999' : '#fff'
  }
  getAreaFill(area) {
    return (area !== 'Antarctica' && area !== 'Fr. South Antarctic Lands') ? '#eee' : '#fff';
  }
  changeAreaAttributes() {
    let current_id = this.state.id;
    let countries = this.state.data[current_id].Approved;
    constants.country_replacements.forEach((country_replacement) => {
      countries = countries.replace(', ' + country_replacement[0] + ',', ', ' + country_replacement[1] + ',');
    });
    countries = countries.split(', ');

    let origins = this.state.data[current_id].Origin.split(' & ');
    origins.forEach((origin, i) => {
      origins[i] = l[origin];
    });


    this.setState((state, props) => ({
      name:this.state.data[current_id].Name,
      type:this.state.data[current_id].Type,
      developer:this.state.data[current_id].Developer,
      countries:countries.length,
      who:'',
      origin:origins.join(' & ')
    }));

    if (countries.indexOf('WHO') > -1) {
      this.setState((state, props) => ({
        who:'+ WHO'
      }));
    }

    countries.forEach((country) => {
      if (_.where(constants.country_data, {name: country}).length === 0 && country !== 'WHO') {
        console.log(country)
      }
    });
    g.selectAll('.centroid')
      .attr('r', (d, i) => {
        return (countries.indexOf(d.name) < 0) ? 0 : 2;
      });
  }
  componentWillUnMount() {
    clearInterval(interval);
  }
  createInterval() {
    this.setState((state, props) => ({
      id:this.state.id + 1
    }), this.changeAreaAttributes);
    interval = setInterval(() => {
      this.setState((state, props) => ({
        id:this.state.id + 1
      }), this.changeAreaAttributes);
      if (this.state.id >= (this.state.data.length - 1)) {
        clearInterval(interval);
      }
    }, 4000);
  }
  render() {
    return (
      <div className={style.plus} style={(this.state.id > -1) ? {display: 'table-cell'} : {display: 'none'}}>
        <h3>As of 3.6.2021</h3>
        <div>
          <div className={style.map_container}></div>
        </div>
        <div className={style.meta_container}>
          <div><span className={style.name}>{this.state.name}</span>, <span className={style.type}>{this.state.type}</span></div>
          <div><span className={style.developer}>{this.state.developer}</span>, <span className={style.origin}>{this.state.origin}</span></div>
          <div>{l.['Approved by']} <span className={style.countries}>{this.state.countries} {(this.state.countries > 1) ? l.countries : l.country}</span> <span className={style.who}>{this.state.who}</span></div>
        </div>
      </div>
    );
  }
}
export default App;