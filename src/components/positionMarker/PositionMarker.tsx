import css from "./PositionMarker.module.less"
import React from "react"
import { merge } from "../../lib/utils/arrayUtils"
import { Marker } from "react-map-gl"

interface IProps {
  className?: string
  latitude: number
  longitude: number
}

const componentName = "PositionMarker"
const debug = require("debug")(`front:${componentName}`)

/**
 * @name PositionMarker
 */
function PositionMarker(props: IProps) {
  return (
    <Marker
      latitude={props.latitude}
      longitude={props.longitude}
      captureClick={false}
      captureDrag={false}
      captureScroll={false}
      captureDoubleClick={false}
      capturePointerMove={false}
    >
      <div className={css.marker}></div>
    </Marker>
  )
}

export default PositionMarker
