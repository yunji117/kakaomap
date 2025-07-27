import { useEffect, useRef } from 'react';

const SimpleNaverMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 네이버 지도 API 스크립트 로드
    const loadNaverMaps = () => {
      // 기존 스크립트 제거
      const existingScript = document.querySelector('script[src*="oapi.map.naver.com"]');
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement('script');
      script.type = 'text/javascript';
      
      // 환경변수에서 클라이언트 ID 가져오기
      const clientId = import.meta.env.VITE_NAVER_CLIENT_ID;
      console.log('✅ 네이버 Client ID:', clientId);
      
      if (!clientId) {
        console.error('❌ 네이버 지도 클라이언트 ID가 설정되지 않았습니다.');
        return;
      }

      // 변경된 네이버 Maps API URL (ncpKeyId 사용)
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`;
      
      script.onload = () => {
        console.log('✅ 네이버 지도 API 스크립트 로드 완료');
        initializeMap();
      };
      
      script.onerror = () => {
        console.error('❌ 네이버 지도 API 로드 실패');
      };
      
      document.head.appendChild(script);
    };

    // 네이버 공식 문서 기본 예제 기반 지도 초기화
    const initializeMap = () => {
      if (!mapRef.current || !window.naver?.maps) {
        console.error('❌ 지도 컨테이너 또는 네이버 지도 API를 찾을 수 없습니다.');
        return;
      }

      try {
        console.log('🗺️ 네이버 지도 초기화 시작...');
        
        // 네이버 공식 문서 기본 예제
        // var mapDiv = document.getElementById('map');
        const mapDiv = mapRef.current;
        
        // 옵션 없이 지도 객체를 생성하면 서울 시청을 중심으로 하는 16 레벨의 지도가 생성됩니다.
        // var map = new naver.maps.Map(mapDiv);
        const map = new window.naver.maps.Map(mapDiv);

        // 인증 실패 처리 함수 추가
        (window as any).navermap_authFailure = function () {
          console.error('❌ 네이버 지도 API 인증 실패');
          console.error('🔑 클라이언트 ID와 웹 서비스 URL을 확인해주세요');
        };

        console.log('✅ 네이버 지도 기본 예제 생성 완료', map);
        console.log('📍 중심좌표: 서울시청 (기본값)');
        console.log('🔍 줌 레벨: 16 (기본값)');
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error('❌ 지도 초기화 중 오류 발생:', error);
        console.error('오류 메시지:', errorMessage);
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
    <div className="w-full h-screen">
      {/* 지도 컨테이너 */}
      <div 
        ref={mapRef}
        id="map"
        className="w-full h-full"
      />
    </div>
  );
};

export default SimpleNaverMap;
