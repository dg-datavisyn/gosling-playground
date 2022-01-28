import {useEffect, useRef, useState} from 'react';
import {validateGoslingSpec, GoslingComponent, GoslingSpec} from "gosling.js";
import './App.css';
import "lineupjsx/build/LineUpJSx.css";
import {ChromosomeInfo} from 'higlass';
import React from 'react';
import LineUp from 'lineupjsx';
import data from './Export.json'
import { debounce } from 'ts-debounce';

const arr = data as any[];

const goslingSpec = (domain: any, mark: any, binSize: any, height: any, hoveredSample: any): GoslingSpec => {
  return {
    "title": "Visual Linking",
    "subtitle": "Change the position and range of brushes to update the detail view on the bottom",
    "arrangement": "horizontal",
    "centerRadius": 0.4,
    "width": 1800,
    "views": [
      {
        "spacing": 40,
        "arrangement": "horizontal",
        "views": [
          {
            "spacing": 5,
            "static": true,
            "id": "circular-view-1",
            "layout": "circular",
            "xDomain": {"chromosome": "1"},
            "alignment": "overlay",
            "tracks": [
              {"mark": "bar"},
              {"mark": "brush", "x": {"linkingId": "detail"}}
            ],
            "data": {
              "url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec",
              "type": "multivec",
              "row": "sample",
              "column": "position",
              "value": "peak",
              "categories": ["sample 1", "sample 2", "sample 3", "sample 4"]
            },
            "x": {"field": "start", "type": "genomic"},
            "xe": {"field": "end", "type": "genomic"},
            "y": {"field": "peak", "type": "quantitative"},
            "row": {"field": "sample", "type": "nominal"},
            "color": {"field": "sample", "type": "nominal"},
            "width": 250,
            "height": 130
          },
          {
            "id": "linear-view-1",
            "layout": "linear",
            "xDomain": {"chromosome": "1"},
            "alignment": "overlay",
            "tracks": [
              {"mark": "bar", "width": 1000},
              {"mark": "brush", "x": {"linkingId": "detail"}}
            ],
            "data": {
              "url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec",
              "type": "multivec",
              "row": "sample",
              "column": "position",
              "value": "peak",
              "categories": ["sample 1", "sample 2", "sample 3", "sample 4"]
            },
            "x": {"field": "start", "type": "genomic"},
            "xe": {"field": "end", "type": "genomic"},
            "y": {"field": "peak", "type": "quantitative"},
            "row": {"field": "sample", "type": "nominal"},
            "color": {"field": "sample", "type": "nominal"},
            "width": 400,
            "height": 200
          }
        ]
      },
      {
        "layout": "linear",
        "xDomain": {"chromosome": "1", "interval": [160000000, 200000000]},
        "linkingId": "detail",
        "tracks": [
          {
            "data": {
              "url": "https://server.gosling-lang.org/api/v1/tileset_info/?d=cistrome-multivec",
              "type": "multivec",
              "row": "sample",
              "column": "position",
              "value": "peak",
              "categories": ["sample 1", "sample 2", "sample 3", "sample 4"]
            },
            "mark": "bar",
            "x": {"field": "position", "type": "genomic", "axis": "top"},
            "y": {"field": "peak", "type": "quantitative"},
            "row": {"field": "sample", "type": "nominal"},
            "color": {"field": "sample", "type": "nominal"},
            "width": 690,
            "height": 200
          },
          {
            "width": 800,
            "height": 180,
            "data": {
              "url": "https://resgen.io/api/v1/tileset_info/?d=UvVPeLHuRDiYA3qwFlm7xQ",
              "type": "multivec",
              "row": "base",
              "column": "position",
              "value": "count",
              "categories": ["A", "T", "G", "C"],
              "start": "start",
              "end": "end",
              "binSize": 16
            },
            "mark": "text",
            "y": {"field": "count", "type": "quantitative"},
            "style": {"textStrokeWidth": 0},
            "stretch": true,
            "x": {"field": "start", "type": "genomic", "axis": "top"},
            "xe": {"field": "end", "type": "genomic"},
            "color": {
              "field": "base",
              "type": "nominal",
              "domain": ["A", "T", "G", "C"]
            },
            "text": {"field": "base", "type": "nominal"}
          }
        ]
      }
    ]
  }
};

const spec = goslingSpec([+0, 0.001], 'rect', 0, 130, null);

function App() {

  // eslint-disable-next-line
  const gosRef = useRef<any>(null);

  const [coordinates, setCoordinates] = useState('None')
  const [lineupData, setLineupData] = useState(arr);

  // validate the spec
  const validity = validateGoslingSpec(goslingSpec);

  if (validity.state === 'error') {
    console.warn('Gosling spec is invalid!', validity.message);
  }

  useEffect(() => {
    if (!gosRef.current) return;
    const viewIds = gosRef.current.api.getViewIds();
    console.log(viewIds)
    const ref = gosRef.current;
    gosRef.current.hgRef.current.api.on('mouseMoveZoom', () => {
      console.log("asdas")
    },'linear-view-1');
    console.log(gosRef.current);

  }, [gosRef]);

  const updateCoordinatesString = (event : any) => {
    console.log(event)
    const chromInfo = ChromosomeInfo(
      'http://higlass.io/api/v1/chrom-sizes/?id=Ajn_ttUUQbqgtOD4nOt-IA',
      (chromInfo:any) => { 
        if(chromInfo){
          console.log('chromInfo:', chromInfo); 
          const chromPosStart = chromInfo.absToChr(event.xDomain[0]);
          const chromPosEnd = chromInfo.absToChr(event.xDomain[1]);
          setCoordinates(`Range from chromosome ${chromPosStart[0]} at ${chromPosStart[1]} to  chromosome ${chromPosEnd[0]} at ${chromPosEnd[1]}`)
          const filteredLineupData = arr.filter((gene) => {
            const geneStart  = chromInfo.chrToAbs([gene['Chromosome'], gene['Seq Region Start']]);
            const geneEnd    = chromInfo.chrToAbs([gene['Chromosome'], gene['Seq Region End']]);
            return geneStart >= chromPosStart[1] && geneEnd < chromPosEnd[1];
          });
          setLineupData(filteredLineupData);
        }
      });
  }

  const debouncedUpdateCoordinateString = debounce(updateCoordinatesString, 500);

  const activateSync = () => {
    if (!gosRef.current) return;
    //gosRef.current.api.zoomTo('linear-view-1','chr1:10000-15000')
    gosRef.current.hgRef.current.api.on('location', debouncedUpdateCoordinateString, 'linear-view-1');
    // gosRef.current.hgRef.current.api.on('location', (event:any) => {
    //   console.log(event)
    // },'circular-view-1');
  }

  const getLocation = () => {
    const local = gosRef.current.hgRef.current.api.getLocation('linear-view-1');
    const chromInfo = ChromosomeInfo(
      'http://higlass.io/api/v1/chrom-sizes/?id=Ajn_ttUUQbqgtOD4nOt-IA',
      (chromInfo:any) => { 
        console.log('chromInfo:', chromInfo); 
        const chromPosStart = chromInfo.absToChr(local.xDomain[0]);
        const chromPosEnd = chromInfo.absToChr(local.xDomain[1]);
        setCoordinates(`Range from chromosome ${chromPosStart[0]} at ${chromPosStart[1]} to  chromosome ${chromPosEnd[0]} at ${chromPosEnd[1]}`)
      });
  }

  return (
    <div className="App">
      <GoslingComponent
        ref={gosRef}
        spec={spec}
      />
      <button onClick={activateSync}>Sync</button>
      <button onClick={getLocation}>Get location</button>
      <p>{coordinates}</p>
      <LineUp data={lineupData} ></LineUp>
    </div>
  );
}

export default App;
