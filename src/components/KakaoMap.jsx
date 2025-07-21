import { useEffect } from 'react'

const KakaoMap = () => {
  useEffect(() => {
    // 카카오맵 API 스크립트 동적 로드
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=b64aec3010a5404f8a229a4f453cc9d2&autoload=false&libraries=services,clusterer,drawing`
    
    script.onload = () => {
      // kakao.maps.load()를 사용하여 API 로드 완료를 기다림
      window.kakao.maps.load(() => {
        // 지도를 담을 영역의 DOM 레퍼런스
        const container = document.getElementById('map')
        
        console.log('map 컨테이너:', container)
        console.log('컨테이너 크기:', container ? `${container.offsetWidth}x${container.offsetHeight}` : 'null')
        
        if (!container) {
          console.error('map div를 찾을 수 없습니다!')
          return
        }
        
        // 지도를 생성할 때 필요한 기본 옵션
        const options = {
          center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울시청으로 변경
          level: 5 // 더 넓은 뷰로 변경
        }

        // 지도 생성 및 객체 리턴
        const map = new window.kakao.maps.Map(container, options)
        
        // 주소-좌표 변환 객체 생성
        const geocoder = new window.kakao.maps.services.Geocoder()
        
        // 클릭한 위치 저장용
        let currentPolygon = null
        let infoWindow = null
        
        // 지도 클릭 이벤트 등록
        window.kakao.maps.event.addListener(map, 'click', function(mouseEvent) {
          // 기존 폴리곤과 정보창 제거
          if (currentPolygon) {
            currentPolygon.setMap(null)
          }
          if (infoWindow) {
            infoWindow.close()
          }
          
          // 클릭한 위치의 좌표
          const latlng = mouseEvent.latLng
          const clickLat = latlng.getLat()
          const clickLng = latlng.getLng()
          
          console.log(`클릭된 위치: 위도 ${clickLat}, 경도 ${clickLng}`)
          
          // 좌표를 주소로 변환
          geocoder.coord2Address(clickLng, clickLat, function(result, status) {
            if (status === window.kakao.maps.services.Status.OK) {
              const addr = result[0]
              const roadAddr = addr.road_address ? addr.road_address.address_name : ''
              const jibunAddr = addr.address ? addr.address.address_name : ''
              
              console.log('🏠 주소 정보:')
              console.log('📍 지번 주소:', jibunAddr)
              console.log('🛣️ 도로명 주소:', roadAddr)
              
              // 해당 지역의 가상 토지 구획 생성 (더 정교한 모양)
              const offset = 0.0008 // 약 80m 정도의 범위
              const polygonPath = [
                new window.kakao.maps.LatLng(clickLat + offset * 0.8, clickLng - offset * 0.6),
                new window.kakao.maps.LatLng(clickLat + offset * 0.9, clickLng + offset * 0.4),
                new window.kakao.maps.LatLng(clickLat + offset * 0.3, clickLng + offset * 0.8),
                new window.kakao.maps.LatLng(clickLat - offset * 0.2, clickLng + offset * 0.9),
                new window.kakao.maps.LatLng(clickLat - offset * 0.7, clickLng + offset * 0.2),
                new window.kakao.maps.LatLng(clickLat - offset * 0.8, clickLng - offset * 0.5),
                new window.kakao.maps.LatLng(clickLat - offset * 0.1, clickLng - offset * 0.9),
                new window.kakao.maps.LatLng(clickLat + offset * 0.5, clickLng - offset * 0.8)
              ]

              // 새로운 폴리곤 생성 (땅야 스타일과 유사하게)
              currentPolygon = new window.kakao.maps.Polygon({
                path: polygonPath,
                strokeWeight: 3,
                strokeColor: '#FF7B00', // 주황색 테두리 (땅야와 유사)
                strokeOpacity: 1,
                strokeStyle: 'solid',
                fillColor: '#FF7B00', // 주황색 채우기
                fillOpacity: 0.3
              })

              // 지도에 폴리곤 표시
              currentPolygon.setMap(map)
              
              // 정보창 내용 생성
              const content = `
                <div style="padding:10px; min-width:200px; font-size:12px;">
                  <div style="font-weight:bold; margin-bottom:5px; color:#FF7B00;">
                    🏞️ 선택된 토지
                  </div>
                  <div><strong>지번:</strong> ${jibunAddr || '정보없음'}</div>
                  <div><strong>도로명:</strong> ${roadAddr || '정보없음'}</div>
                  <div><strong>면적:</strong> 약 ${Math.floor(Math.random() * 500 + 100)}㎡</div>
                  <div><strong>지목:</strong> ${['대지', '임야', '전', '답', '과수원'][Math.floor(Math.random() * 5)]}</div>
                  <div style="margin-top:8px;">
                    <button style="background:#FF7B00; color:white; border:none; padding:4px 8px; border-radius:3px; cursor:pointer;">
                      📋 상세정보
                    </button>
                  </div>
                </div>
              `
              
              // 정보창 생성 및 표시
              infoWindow = new window.kakao.maps.InfoWindow({
                content: content,
                position: latlng,
                removable: true
              })
              
              infoWindow.open(map)
              
              // 폴리곤 클릭 이벤트
              window.kakao.maps.event.addListener(currentPolygon, 'click', function() {
                console.log('🏗️ 토지 상세정보 요청')
                alert(`토지 정보\n주소: ${jibunAddr}\n이곳에 상세정보 팝업을 구현할 수 있습니다.`)
              })
              
            } else {
              console.log('주소를 찾을 수 없습니다.')
            }
          })
        })
        
        console.log('생성된 맵 객체:', map)
        console.log('🗺️ 지도를 클릭하면 해당 토지 정보가 표시됩니다.')
        console.log('💡 실제 지적도 데이터 연동을 위해서는 별도의 지적도 API가 필요합니다.')
      })
    }
    
    script.onerror = () => {
      console.error('카카오맵 API 로드에 실패했습니다.')
    }
    
    document.head.appendChild(script)

    // 컴포넌트 언마운트 시 스크립트 정리
    return () => {
      const existingScript = document.querySelector('script[src*="dapi.kakao.com"]')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
      {/* 지도를 담을 영역 */}
      <div 
        id="map" 
        style={{
          width: '100%',
          height: '100%',
          minHeight: '100vh',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      ></div>
    </div>
  )
}

export default KakaoMap