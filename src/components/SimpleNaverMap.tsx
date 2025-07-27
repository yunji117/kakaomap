import { useEffect, useRef } from 'react';

const SimpleNaverMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 네이버 지도 API 스크립트 로드
    const loadNaverMaps = () => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      // 환경변수에서 클라이언트 ID 가져오기
      const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      
      if (!clientId || clientId === 'YOUR_NAVER_CLIENT_ID') {
        console.error('네이버 지도 클라이언트 ID가 설정되지 않았습니다.');
        console.log('환경변수 VITE_NAVER_CLIENT_ID를 설정해주세요.');
        return;
      }

      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
      
      script.onload = () => {
        initializeMap();
      };
      
      script.onerror = () => {
        console.error('네이버 지도 API 로드 실패');
      };
      
      document.head.appendChild(script);
    };

    // 지도 초기화
    const initializeMap = () => {
      if (!mapRef.current || !window.naver?.maps) {
        console.error('지도 컨테이너 또는 네이버 지도 API를 찾을 수 없습니다.');
        return;
      }

      try {
        // 지도 옵션 설정
        const mapOptions = {
          center: new window.naver.maps.LatLng(37.5665, 126.9780), // 서울시청
          zoom: 16, // 지적도가 잘 보이는 줌 레벨
          mapTypeControl: true,
          mapTypeControlOptions: {
            style: window.naver.maps.MapTypeControlStyle.BUTTON,
            position: window.naver.maps.Position.TOP_RIGHT
          },
          zoomControl: true,
          zoomControlOptions: {
            style: window.naver.maps.ZoomControlStyle.LARGE,
            position: window.naver.maps.Position.TOP_LEFT
          }
        };

        // 네이버 지도 생성
        const map = new window.naver.maps.Map(mapRef.current, mapOptions);
        
        // 지적도 레이어 추가
        const cadastralLayer = new window.naver.maps.CadastralLayer();
        cadastralLayer.setMap(map);

        console.log('✅ 네이버 지도와 지적도 레이어가 성공적으로 로드되었습니다.');
        
      } catch (error) {
        console.error('지도 초기화 중 오류 발생:', error);
      }
    };

    // 스크립트 로드 시작
    loadNaverMaps();

    // 컴포넌트 언마운트 시 정리
    return () => {
      const script = document.querySelector('script[src*="oapi.map.naver.com"]');
      if (script) {
        script.remove();
      }
    };
  }, []);

  return (
    <div className="w-full h-screen relative">
      {/* 지도 컨테이너 */}
      <div 
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '100vh' }}
      />
      
      {/* 안내 메시지 */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 p-3 rounded-lg shadow-lg z-10">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">
          🗺️ 네이버 지도 + 지적도
        </h3>
        <p className="text-xs text-gray-600">
          지적도 레이어가 활성화되어 있습니다
        </p>
      </div>
    </div>
  );
};

export default SimpleNaverMap;
