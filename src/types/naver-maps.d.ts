// 네이버 지도 API 타입 정의
declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options?: MapOptions) => NaverMap;
        LatLng: new (lat: number, lng: number) => LatLng;
        LatLngBounds: new () => LatLngBounds;
        Polygon: new (options: PolygonOptions) => Polygon;
        CadastralLayer: new () => CadastralLayer;
        InfoWindow: new (options: InfoWindowOptions) => InfoWindow;
        Size: new (width: number, height: number) => Size;
        Point: new (x: number, y: number) => Point;
        Event: {
          addListener: (target: any, eventName: string, listener: Function) => void;
        };
        Service: {
          reverseGeocode: (options: any, callback: Function) => void;
          Status: {
            ERROR: string;
            OK: string;
          };
        };
        Position: {
          TOP_LEFT: string;
          TOP_RIGHT: string;
        };
        ZoomControlStyle: {
          LARGE: string;
        };
        MapTypeControlStyle: {
          BUTTON: string;
        };
      };
    };
  }
}

interface MapOptions {
  center?: LatLng;
  zoom?: number;
  mapTypeControl?: boolean;
  mapTypeControlOptions?: {
    style: string;
    position: string;
  };
  zoomControl?: boolean;
  zoomControlOptions?: {
    style: string;
    position: string;
  };
}

interface InfoWindowOptions {
  content: string;
  position: LatLng;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  anchorSize?: Size;
  pixelOffset?: Point;
}

interface LatLng {
  lat(): number;
  lng(): number;
}

interface NaverMap {
  fitBounds(bounds: LatLngBounds): void;
}

interface LatLngBounds {
  extend(point: LatLng): void;
}

interface PolygonOptions {
  map?: NaverMap;
  paths: LatLng[];
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  strokeStyle?: string;
}

interface Polygon {
  setMap(map: NaverMap | null): void;
}

interface CadastralLayer {
  setMap(map: NaverMap | null): void;
}

interface InfoWindow {
  open(map: NaverMap): void;
  close(): void;
}

interface Size {
  // Size 인터페이스
}

interface Point {
  // Point 인터페이스
}

export {};
