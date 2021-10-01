import css from "./Map.module.less"
import React, { useEffect, useMemo, useRef, useState } from "react"
import { merge } from "../../lib/utils/arrayUtils"
import { EListener, useBoundingClientRect } from "@wbe/libraries"
import { useLocation } from "@cher-ami/router"
import ReactMapGL, {
  AttributionControl,
  FlyToInterpolator,
  InteractiveMapProps,
  Layer,
  MapEvent,
  MapRef,
  Marker,
  NavigationControl,
  Source,
} from "react-map-gl"
import CustomMarker from "components/CustomMarker/Marker"
import { point, Units } from "@turf/helpers"
import distance from "@turf/distance"
import bearing from "@turf/bearing"
import Compass from "components/compass/Compass"
import { close } from "inspector"
import PositionMarker from "components/positionMarker/PositionMarker"

interface IProps {
  className?: string
}

export interface IMarker {
  latitude: number
  longitude: number
  real: boolean
  found: boolean
  text: string
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

  // Markers management
  const [markers, setMarkers] = useState<IMarker[]>([
    // Sendai
    {
      latitude: 38.25342725471286,
      longitude: 140.85597056161862,
      real: true,
      found: false,
      text: "Sosh",
    },
    // A côté de la côte bretonne
    {
      latitude: 49.69235041316825,
      longitude: -1.9502169526726458,
      real: false,
      found: false,
      text: "plouf",
    },
    // Groenland
    {
      latitude: 60.28381951220709,
      longitude: -43.384842033735914,
      real: false,
      found: false,
      text: "brr",
    },
    // Washinton
    {
      latitude: 38.88507680175829,
      longitude: -77.04479534149999,
      real: false,
      found: false,
      text: "raté",
    },
    // Chili
    {
      latitude: -33.204878912888724,
      longitude: -70.81293887483662,
      real: false,
      found: false,
      text: "non plus !",
    },
    // Yémen
    {
      latitude: 12.556359886322362,
      longitude: 54.029780730929524,
      real: false,
      found: false,
      text: "Dommage !",
    },
    // Russie
    {
      latitude: 62.03715989584269,
      longitude: 129.74276950415128,
      real: false,
      found: false,
      text: "Loupé !",
    },
  ])

  const attributionStyle = {
    right: 0,
    top: 0,
  }

  const markerComponents = useMemo(() => {
    return markers.map((marker, index) => (
      <CustomMarker
        key={`marker${index}`}
        markerData={marker}
        onClick={() => {
          const newMarkers = [...markers]
          newMarkers[index] = { ...markers[index], found: true }
          setMarkers(newMarkers)
        }}
      />
    ))
  }, [markers])

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
      const distances = filteredMarkers.map((marker) =>
        distanceToPoint({ latitude: marker.latitude, longitude: marker.longitude })
      )
      const closestIndex = distances.indexOf(Math.min(...distances))
      if (closestIndex !== -1) {
        const degrees = degreeToPoint({
          latitude: filteredMarkers[closestIndex].latitude,
          longitude: filteredMarkers[closestIndex].longitude,
        })
        setAngle(degrees)
      }
    }
  }, [viewport, loaded])

  console.log(isMinimapActive)

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
      >
        {markerComponents}
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
          ref={mapRef}
          onMouseEnter={() => {
            setIsMinimapActive(true)
          }}
          onMouseLeave={() => {
            setIsMinimapActive(false)
          }}
          style={{
            zIndex: 4,
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
