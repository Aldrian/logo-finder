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
import { randomPoint } from "@turf/random"
import { featureEach } from "@turf/meta"
import Helper from "components/helper/Helper"
import Popin from "components/popin/Popin"
import Tips from "components/tips/Tips"

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

  const baseLocation = {
    latitude: 49.71821126434087,
    longitude: -1.9432687434509714,
  }

  const [loaded, setLoaded] = useState(false)

  const [zoom, setZoom] = useState(15)

  const [viewport, setViewport] = useState<InteractiveMapProps>(() => ({
    maxZoom: zoom,
    minZoom: zoom,
    maxPitch: 0,
    minPitch: 0,
    width: 0,
    height: 0,
    latitude: baseLocation.latitude,
    longitude: baseLocation.longitude,
    zoom: zoom,
    dragRotate: false,
  }))

  useEffect(() => {
    setViewport({
      ...viewport,
      maxZoom: zoom,
      minZoom: zoom,
      zoom: zoom,
    })
  }, [zoom])

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
      if (error) {
        throw error
      }
      if (!map.hasImage("soshLogo")) {
        map.addImage("soshLogo", image)
      }
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

  const [minimapZoom, setMinimapZoom] = useState(1)

  const [isMinimapActive, setIsMinimapActive] = useState(false)

  const [minimapViewport, setMinimapViewport] = useState<InteractiveMapProps>(() => ({
    maxZoom: minimapZoom,
    minZoom: minimapZoom,
    maxPitch: 0,
    minPitch: 0,
    width: 400,
    height: 200,
    latitude: baseLocation.latitude,
    longitude: baseLocation.longitude,
    zoom: minimapZoom,
    dragPan: false,
    dragRotate: false,
    keyboard: false,
  }))

  useEffect(() => {
    setMinimapViewport({
      ...minimapViewport,
      maxZoom: minimapZoom,
      minZoom: minimapZoom,
      zoom: minimapZoom,
    })
  }, [minimapZoom])

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

  // const baseMarkers: IMarker[] = [
  //   // Sendai
  //   {
  //     id: 0,
  //     latitude: 38.25342725471286,
  //     longitude: 140.85597056161862,
  //     real: true,
  //     found: false,
  //     text: "Sosh",
  //   },
  //   // A côté de la côte bretonne
  //   {
  //     id: 1,
  //     latitude: 49.69235041316825,
  //     longitude: -1.9502169526726458,
  //     real: false,
  //     found: false,
  //     text: "plouf",
  //   },
  //   // Groenland
  //   {
  //     id: 2,
  //     latitude: 60.28381951220709,
  //     longitude: -43.384842033735914,
  //     real: false,
  //     found: false,
  //     text: "brr",
  //   },
  //   // Washinton
  //   {
  //     id: 3,
  //     latitude: 38.88507680175829,
  //     longitude: -77.04479534149999,
  //     real: false,
  //     found: false,
  //     text: "raté",
  //   },
  //   // Chili
  //   {
  //     id: 4,
  //     latitude: -33.204878912888724,
  //     longitude: -70.81293887483662,
  //     real: false,
  //     found: false,
  //     text: "non plus !",
  //   },
  //   // Yémen
  //   {
  //     id: 5,
  //     latitude: 12.556359886322362,
  //     longitude: 54.029780730929524,
  //     real: false,
  //     found: false,
  //     text: "Dommage !",
  //   },
  //   // Russie
  //   {
  //     id: 6,
  //     latitude: 62.03715989584269,
  //     longitude: 129.74276950415128,
  //     real: false,
  //     found: false,
  //     text: "Loupé !",
  //   },
  // ]

  // Markers management
  const [pointCount, setPointCount] = useState(100)

  const generateMarkers = () => {
    const generatedMarkers = randomPoint(pointCount)
    function randomIntFromInterval(min, max) {
      // min and max included
      return Math.floor(Math.random() * (max - min + 1) + min)
    }
    //const winningIndex = randomIntFromInterval(0, pointCount - 1)

    let baseMarkers: IMarker[] = []
    featureEach(generatedMarkers, (generatedMarker, index) => {
      baseMarkers[index] = {
        id: index,
        latitude: generatedMarker.geometry.coordinates[0],
        longitude: generatedMarker.geometry.coordinates[1],
        real: false,
        found: false,
        text: "",
      } as IMarker
    })

    baseMarkers[pointCount] = {
      id: pointCount,
      latitude: 38.25342725471286,
      longitude: 140.85597056161862,
      real: true,
      found: false,
      text: "Sosh",
    }
    return baseMarkers
  }

  const [markers, setMarkers] = useState<IMarker[]>(generateMarkers())

  useEffect(() => {
    setMarkers(generateMarkers())
  }, [pointCount])

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

  const markerFeatureCollection = useMemo(() => {
    const points = markers.map((marker) => {
      return point(
        [marker.longitude, marker.latitude], // Coordinates [lat, lon]
        { text: marker.text, id: marker.id, icon: "soshLogo" } // properties
      )
    })
    return featureCollection(points)
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
  }, [viewport, loaded, markers])

  const [currentMarker, setCurrentMarker] = useState(null)

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
            { layers: ["markers"] }
          )[0]
          if (feature) {
            const markerIndex = markers.findIndex(
              (marker) => marker.id === feature.properties.id
            )
            if (markerIndex !== -1) {
              const newMarkers = [...markers]
              newMarkers[markerIndex] = { ...markers[markerIndex], found: true }
              setMarkers(newMarkers)
              setCurrentMarker(newMarkers[markerIndex])
            }
          }
        }}
      >
        {/* {markerComponents} */}
        <Source id="markers" type="geojson" data={markerFeatureCollection}>
          <Layer
            id="markers"
            type="symbol"
            source="markers"
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
      <Helper
        zoom={zoom}
        setZoom={setZoom}
        minimapZoom={minimapZoom}
        setMinimapZoom={setMinimapZoom}
        pointCount={pointCount}
        setPointCount={setPointCount}
      />
      {currentMarker && (
        <Popin
          marker={currentMarker}
          onClose={() => {
            setCurrentMarker(null)
          }}
        />
      )}
      <Tips />
    </div>
  )
}

export default Map
