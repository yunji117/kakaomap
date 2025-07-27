// 네이버 지도 API 타입 정의
declare global {
  interface Window {
    naver: {
      maps: {
        Map: new (element: HTMLElement, options?: MapOptions) => NaverMap;
        LatLng: new (lat: number, lng: number) => LatLng;
        CadastralLayer: new () => CadastralLayer;
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

interface LatLng {
  lat(): number;
  lng(): number;
}

interface NaverMap {
  // 필요한 메서드들만 정의
}

interface CadastralLayer {
  setMap(map: NaverMap | null): void;
}

export {};
