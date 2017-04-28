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
    height: 10, width: 10, top: -5, left: -5,
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
    {data.map(stop => (<AComponent
      key = {stop.seq}
      lat = {stop.location.latitude}
      lng = {stop.location.longitude}
      text = {stop.nameTc}
      />)
    )}

  </GoogleMapReact>
);

export default GoogleMapComponent;
