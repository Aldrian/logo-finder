import css from "./Marker.module.less"
import React from "react"
import { merge } from "../../lib/utils/arrayUtils"
import { Marker } from "react-map-gl"
import { IMarker } from "components/map/Map"

interface IProps {
  className?: string
  markerData: IMarker
  onClick: () => void
}

const componentName = "Marker"
const debug = require("debug")(`front:${componentName}`)

/**
 * @name Marker
 */
function CustomMarker(props: IProps) {
  return (
    <Marker
      latitude={props.markerData.latitude}
      longitude={props.markerData.longitude}
      captureClick={true}
      captureDrag={false}
      captureScroll={false}
      captureDoubleClick={false}
      capturePointerMove={false}
      onClick={props.onClick}
    >
      {props.markerData.found ? (
        <div
          className={merge([
            css.found,
            props.markerData.real ? css.found_real : css.found_fake,
          ])}
        >
          <span>{props.markerData.text}</span>
        </div>
      ) : (
        <div className={css.not_found}>
          <span>?</span>
        </div>
      )}
    </Marker>
  )
}

export default CustomMarker
