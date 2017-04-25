import React from 'react';

import GoogleMapReact from 'google-map-react';

import Config from '../../config';

const data = [];

const defaultSetting = {
  center: {
    lat: 22.396428,
    lng: 114.10949700000003},
  zoom: 11
};

const AComponent = ({ text }) => (
  <div style={{
    position: 'relative', color: 'black', background: 'red',
    height: 50, width: 50, top: -25, left: -25,
  }}>
    {text}
  </div>
);

let GoogleMapComponent = props => (
  <GoogleMapReact
    bootstrapURLKeys = {{
      key: Config.GoogleMap.apiKey
    }}
    defaultCenter = {defaultSetting.center}
    defaultZoom = {defaultSetting.zoom}>
    {data.map(stop => {
      return (<AComponent
        key = {stop.seq}
        lat = {stop.location.lat}
        lng = {stop.location.lng}
        text = {stop.nameTc}
        />);
      }
    )}

  </GoogleMapReact>
);

export default GoogleMapComponent;
