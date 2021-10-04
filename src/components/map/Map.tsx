import css from "./Map.module.less"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { merge } from "../../lib/utils/arrayUtils"
import { EListener, useBoundingClientRect } from "@wbe/libraries"
import { useLocation } from "@cher-ami/router"
import ReactMapGL, {
  AttributionControl,
  InteractiveMapProps,
  MapEvent,
  MapRef,
  Source,
  Layer,
} from "react-map-gl"
import CustomMarker from "components/CustomMarker/Marker"
import { featureCollection, point, Units } from "@turf/helpers"
import distance from "@turf/distance"
import bearing from "@turf/bearing"
import Compass from "components/compass/Compass"
import PositionMarker from "components/positionMarker/PositionMarker"
import soshLogo from "./sosh.png"
import CryptoJS from "crypto-js"

interface IProps {
  className?: string
}

export interface IMarker {
  id: number
  latitude: number
  longitude: number
  real: boolean
  found: boolean
  text: string
}

export interface ISimpleMarker {
  id: number
  found: boolean
}

interface IPoint {
  latitude: number
  longitude: number
}

const componentName = "Map"
const debug = require("debug")(`front:${componentName}`)

/**
 * @name Map
 */

function Map(props: IProps) {
  // Initalize map camera & style
  const [_, setLocation] = useLocation()
  const mapRef = useRef<MapRef>()
  const rootRef = useRef<HTMLDivElement>(null)
  const rootRect = useBoundingClientRect(rootRef, EListener.ON_RESIZE)

  const initialZoom = 15
  const minZoom = 15
  const maxZoom = 15

  const baseLocation = {
    latitude: 49.71821126434087,
    longitude: -1.9432687434509714,
  }

  const [loaded, setLoaded] = useState(false)

  const [viewport, setViewport] = useState<InteractiveMapProps>(() => ({
    maxZoom,
    minZoom,
    maxPitch: 0,
    minPitch: 0,
    width: 0,
    height: 0,
    latitude: baseLocation.latitude,
    longitude: baseLocation.longitude,
    zoom: initialZoom,
    dragRotate: false,
  }))

  // Handle viewport change
  useEffect(() => {
    setViewport({
      ...viewport,
      width: rootRect?.width,
      height: rootRect?.height,
    })
  }, [rootRect])

  // Load map images
  useEffect(() => {
    const map = mapRef.current.getMap()
    map.loadImage(soshLogo, (error, image) => {
      if (error) throw error
      if (!map.hasImage("soshLogo")) map.addImage("soshLogo", image, { sdf: true })
    })
  }, [mapRef])

  const handleViewportChange = (nextViewport: InteractiveMapProps) => {
    setViewport({ ...nextViewport })
    if (!isMinimapActive) {
      setMinimapViewport({
        ...minimapViewport,
        latitude: nextViewport.latitude,
        longitude: nextViewport.longitude,
      })
    }
  }

  // Minimap

  const minimapInitialZoom = 1
  const minimapMinZoom = 1
  const minimapMaxZoom = 1

  const [isMinimapActive, setIsMinimapActive] = useState(false)

  const [minimapViewport, setMinimapViewport] = useState<InteractiveMapProps>(() => ({
    maxZoom: minimapMaxZoom,
    minZoom: minimapMinZoom,
    maxPitch: 0,
    minPitch: 0,
    width: 400,
    height: 200,
    latitude: baseLocation.latitude,
    longitude: baseLocation.longitude,
    zoom: minimapInitialZoom,
    dragPan: false,
    dragRotate: false,
    keyboard: false,
  }))

  // Handle minimap viewport change
  const handleMinimapViewportChange = (nextViewport: InteractiveMapProps) => {
    if (isMinimapActive) {
      setMinimapViewport({ ...nextViewport })
    }
    setViewport({
      ...viewport,
      latitude: nextViewport.latitude,
      longitude: nextViewport.longitude,
    })
  }

  const baseData = [
    {
      id: 0,
      latitude: 38.25342725471286,
      longitude: 140.85597056161862,
      real: true,
      found: false,
      text: "Sosh",
    },
    {
      id: 1,
      latitude: 49.69235041316825,
      longitude: -1.9502169526726458,
      real: false,
      found: false,
      text: "plouf",
    },
    {
      id: 2,
      latitude: 60.28381951220709,
      longitude: -43.384842033735914,
      real: false,
      found: false,
      text: "brr",
    },
    {
      id: 3,
      latitude: 38.88507680175829,
      longitude: -77.04479534149999,
      real: false,
      found: false,
      text: "raté",
    },
    {
      id: 4,
      latitude: -33.204878912888724,
      longitude: -70.81293887483662,
      real: false,
      found: false,
      text: "non plus !",
    },
    {
      id: 5,
      latitude: 12.556359886322362,
      longitude: 54.029780730929524,
      real: false,
      found: false,
      text: "Dommage !",
    },
    {
      id: 6,
      latitude: 62.03715989584269,
      longitude: 129.74276950415128,
      real: false,
      found: false,
      text: "Loupé !",
    },
  ]
  const markerString =
    "U2FsdGVkX18tIhhPJtTw4G1CV1KjTEnc7kJh/1iou65PmG/OHm/DoLXN6MGTfsRWeRPQczwtOX+EjcYeIpxYAkd/tr692zKCvVi1A9EYvxVk+fNkef44lP9iho2yHI0ckoetkHJyGm2w4HryQVRnJDtSph7etSHzBNNxsKiBAAi8aH3RVFZVZD4qQdIckjTMOzQCUQVA3IY4bAiPVykb6RN8vZ2AQ+NIrm/RzqVEYNEurrXGvkAuZrp22Gq9kTeE5zLTkTwFnyLhDITAP8AoHeg8/dQF27qBoN97pA6jeu4vz0QjFiwQZuGDPOJ5MTr0T0rIX/gs04+F6Q5uBFHqDPDRGuf7UrQicFihX2YvgeH+g7rOUWLr5soINfEvLpHExZ9vpbL4Gv0xnLFLeRWyzJe5DWg90IhMDtQxTknd6ofDxXnOtkHCOayTEexsw+2CB5iTDcPjXlsIdr47GWCrl0nTBwBbBP512cJ1lLQP5RtpIUjt4NVj4o4kvwGsQ4GhKezQkVPnX//hwYv7W/I2crlvwQm47kCgd5Qz/KugpneqL7+GYktcQ6fwWwzCbIBu+7lrhyeTxgrx1VjMDI7JWTJiRNJnxh8wrDj2FPQF8TMBc2XWWfagnvEKmamg/r7oURAUJWpvewB6bi907srRfGDinKxq9+NUz1/ePj8Fw/BLewuoVshV+6cyCSTYfz707Dk+PtwIoVtTNUkFHzNdioLnrKLuDKVfvWiY3b145BSBdhN/DXmvmxgvJHIQGN/iBjOsPTl5B8mmvJhyFGcpF2VQu7sh/lioW2lp2ZdbF2LhmELS9zkDL66zMXB7MDGEgxIiuqhKBdQosryNGr3LIN3jv36En+JTY+KKYDryhGYiZCmlxd9rsoCcvbLO1yLUL+9VFxEDRAaAi+JiVlHc42KBxUsilgCbqKMCjrwqjCQPBRuG0gBhhAkiqgN0uxnrCOuUcxjV970Z9yA50FZVe/gXHGt/UWFfy07Sf0vQ2w18TIpxgYSQB8BRgro9V1TCkcZkfPQ+b9LVe9NapL84fmqvQKLGfHGOim8Z0SYPy5l3M/KIvp2W3COjChlljKuk"
  const getMarkerData = () => {
    var bytes = CryptoJS.AES.decrypt(markerString, process.env.MAPBOX_KEY)
    var originalText = bytes.toString(CryptoJS.enc.Utf8)
    return JSON.parse(originalText) as IMarker[]
  }

  // Markers management
  const [markers, setMarkers] = useState<ISimpleMarker[]>(
    getMarkerData().map((marker) => ({
      id: marker.id,
      found: false,
    }))
  )

  const attributionStyle = {
    right: 0,
    top: 0,
  }

  // const markerComponents = useMemo(() => {
  //   return markers.map((marker, index) => (
  //     <CustomMarker
  //       key={`marker${index}`}
  //       markerData={marker}
  //       onClick={() => {
  //         console.log("clic")
  //         const newMarkers = [...markers]
  //         newMarkers[index] = { ...markers[index], found: true }
  //         setMarkers(newMarkers)
  //       }}
  //     />
  //   ))
  // }, [markers])

  const fakeMarkers = featureCollection(
    getMarkerData()
      .filter((e) => !e.real)
      .map((marker) => {
        return point(
          [marker.longitude, marker.latitude], // Coordinates [lat, lon]
          { text: marker.text, id: marker.id } // properties
        )
      })
  )

  const realMarkers = featureCollection(
    getMarkerData()
      .filter((e) => e.real)
      .map((marker) => {
        return point(
          [marker.longitude, marker.latitude], // Coordinates [lat, lon]
          { text: marker.text, icon: "soshLogo", id: marker.id } // properties
        )
      })
  )

  // Distance & angle calculation

  const distanceToPoint = (to: IPoint) => {
    const fromPoint = point([viewport.longitude, viewport.latitude])
    const toPoint = point([to.longitude, to.latitude])
    const options = { units: "kilometers" as Units }
    return distance(fromPoint, toPoint, options)
  }

  const degreeToPoint = (to: IPoint) => {
    const fromPoint = point([viewport.longitude, viewport.latitude])
    const toPoint = point([to.longitude, to.latitude])
    return bearing(fromPoint, toPoint)
  }

  const [angle, setAngle] = useState(0)

  // Get distance from viewport to point
  // Filter found markers

  useEffect(() => {
    if (loaded) {
      const filteredMarkers = markers.filter((e) => !e.found)
      const markerData = filteredMarkers.map((marker) =>
        getMarkerData().find((e) => e.id === marker.id)
      )
      const distances = markerData.map((marker) =>
        distanceToPoint({ latitude: marker.latitude, longitude: marker.longitude })
      )
      const closestIndex = distances.indexOf(Math.min(...distances))
      if (closestIndex !== -1) {
        const degrees = degreeToPoint({
          latitude: markerData[closestIndex].latitude,
          longitude: markerData[closestIndex].longitude,
        })
        setAngle(degrees)
      }
    }
  }, [viewport, loaded])

  return (
    <div className={merge([css.root, props.className])} ref={rootRef}>
      <ReactMapGL
        asyncRender={true}
        attributionControl={false}
        {...viewport}
        mapStyle={process.env.MAPBOX_STYLE_URL}
        mapboxApiAccessToken={process.env.MAPBOX_TOKEN}
        onViewportChange={handleViewportChange}
        ref={mapRef}
        onLoad={() => {
          setLoaded(true)
        }}
        onClick={(event) => {
          const feature = mapRef.current.queryRenderedFeatures(
            [event.center.x, event.center.y],
            { layers: ["markers", "marker"] }
          )[0]
          if (feature) {
            const markerIndex = markers.findIndex(
              (marker) => marker.id === feature.properties.id
            )
            if (markerIndex !== -1) {
              const newMarkers = [...markers]
              newMarkers[markerIndex] = { ...markers[markerIndex], found: true }
              setMarkers(newMarkers)
            }
          }
        }}
      >
        {/* {markerComponents} */}
        <Source id="fakeMarkers" type="geojson" data={fakeMarkers}>
          <Layer
            id="markers"
            type="symbol"
            source="fakeMarkers"
            layout={{
              "text-field": ["get", "text"],
              "text-variable-anchor": ["top", "bottom", "left", "right"],
              "text-radial-offset": 0.5,
              "text-justify": "auto",
            }}
            paint={{
              "text-color": "#ffffff",
            }}
          />
        </Source>
        <Source id="realMarkers" type="geojson" data={realMarkers}>
          <Layer
            id="marker"
            type="symbol"
            source="realMarkers"
            paint={{
              "icon-color": "#DF1D53",
            }}
            layout={{
              "icon-image": ["get", "icon"],
            }}
          />
        </Source>
        <AttributionControl compact={true} style={attributionStyle} />
      </ReactMapGL>
      <Compass angle={angle} />
      {/* Minimap */}
      <div className={css.minimap}>
        <ReactMapGL
          asyncRender={true}
          attributionControl={false}
          {...minimapViewport}
          mapStyle={process.env.MAPBOX_STYLE_URL}
          mapboxApiAccessToken={process.env.MAPBOX_TOKEN}
          onViewportChange={handleMinimapViewportChange}
          onMouseEnter={() => {
            setIsMinimapActive(true)
          }}
          onMouseLeave={() => {
            setIsMinimapActive(false)
          }}
          onLoad={() => {
            setLoaded(true)
          }}
          onClick={(e: MapEvent) => {
            const newState = {
              ...minimapViewport,
              longitude: e.lngLat[0],
              latitude: e.lngLat[1],
            }
            setMinimapViewport(newState)
            handleMinimapViewportChange(newState)
          }}
          getCursor={() => {
            return "pointer"
          }}
          style={{
            cursor: "pointer",
          }}
        >
          <PositionMarker
            latitude={minimapViewport.latitude}
            longitude={minimapViewport.longitude}
          />
        </ReactMapGL>
      </div>
    </div>
  )
}

export default Map
