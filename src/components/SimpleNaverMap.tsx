import { useEffect, useRef, useState } from 'react';

const SimpleNaverMap: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [isCadastralMode, setIsCadastralMode] = useState(true); // 지적도 모드 상태
  const [isSatelliteMode, setIsSatelliteMode] = useState(false); // 위성 모드 상태

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
    //   console.log('네이버 Client ID:', clientId);
      
      if (!clientId) {
        console.error('네이버 지도 클라이언트 ID가 설정되지 않았음');
        return;
      }

      // 변경된 네이버 Maps API URL (ncpKeyId 사용) - geocoding 서브모듈 추가
      script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}&submodules=geocoder`;
      
      script.onload = () => {
        console.log('네이버 지도 API 스크립트 로드 완료');
        initializeMap();
      };
      
      script.onerror = () => {
        console.error('네이버 지도 API 로드 실패');
      };
      
      document.head.appendChild(script);
    };

    // 네이버 공식 문서 기본 예제 기반 지도 초기화
    const initializeMap = () => {
      if (!mapRef.current || !window.naver?.maps) {
        console.error('지도 컨테이너 또는 네이버 지도 API를 찾을 수 없습니다.');
        return;
      }

      try {
        console.log('네이버 지도 초기화 시작');
        
        // 네이버 공식 문서 기본 예제
        // var mapDiv = document.getElementById('map');
        const mapDiv = mapRef.current;
        
        // 지도 옵션 설정 - 대전 시청 중심으로 설정
        const mapOptions = {
          center: new window.naver.maps.LatLng(36.3504, 127.3845), // 대전 시청 좌표
          zoom: 16,
          // POI 표시 활성화
          logoControl: false,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: {
            style: window.naver.maps.ZoomControlStyle.LARGE,
            position: window.naver.maps.Position.TOP_RIGHT
          }
        };
        
        // 지도 생성
        const map = new window.naver.maps.Map(mapDiv, mapOptions);

        // 지적도 레이어와 위성 레이어 생성
        const cadastralLayer = new window.naver.maps.CadastralLayer();
        let isCadastralActive = true;
        let isSatelliteActive = false;
        
        // 초기 지적도 레이어 설정
        cadastralLayer.setMap(map);

        // POI 정보 표시를 위한 추가 설정
        console.log('POI 정보가 자동으로 표시됩니다: 건물명, 상점명, 공공시설 등');

        // 레이어 토글 함수들을 전역으로 등록
        (window as any).toggleCadastral = function() {
          if (isCadastralActive) {
            cadastralLayer.setMap(null);
            isCadastralActive = false;
            setIsCadastralMode(false);
          } else {
            cadastralLayer.setMap(map);
            isCadastralActive = true;
            setIsCadastralMode(true);
          }
        };

        (window as any).toggleSatellite = function() {
          if (!isSatelliteActive) {
            // 위성 레이어로 변경
            map.setMapTypeId('satellite');
            isSatelliteActive = true;
            setIsSatelliteMode(true);
          } else {
            // 일반 지도로 변경
            map.setMapTypeId('normal');
            isSatelliteActive = false;
            setIsSatelliteMode(false);
          }
        };

        // 현재 정보창과 경계선 저장용
        let currentInfoWindow: any = null;
        let currentPolygon: any = null;

        // 지도 클릭 이벤트 - 지적 정보 표시 및 경계선 그리기
        window.naver.maps.Event.addListener(map, 'click', function(e: any) {
          const latlng = e.coord;
          const lat = latlng.lat();
          const lng = latlng.lng();
          
          console.log(`클릭된 위치: 위도 ${lat}, 경도 ${lng}`);
          
          // 기존 정보창과 경계선 제거
          if (currentInfoWindow) {
            currentInfoWindow.close();
          }
          if (currentPolygon) {
            currentPolygon.setMap(null);
          }
          
          // 브이월드 API로 실제 지적 정보 조회
          getRealLandInfo(lng, lat).then(realLandData => {
            console.log('브이월드 실제 데이터:', realLandData);
            
            // 토지 경계선 그리기 (브이월드 데이터가 있는 경우)
            if (realLandData && realLandData.geometry && realLandData.geometry.coordinates) {
              drawLandBoundary(realLandData.geometry, realLandData.isRealData);
            }
            
            // 좌표를 주소로 변환 (POI 정보 포함)
            window.naver.maps.Service.reverseGeocode({
              coords: latlng,
              orders: 'legalcode,admcode,addr,roadaddr'
            }, function(status: any, response: any) {
              if (status === window.naver.maps.Service.Status.ERROR) {
                console.log('주소 변환 실패');
                return;
              }
              
              const result = response.v2;
              const address = result.address;
              
              console.log('네이버 reverseGeocode 전체 응답:', response);
              console.log('v2 결과:', result);
              console.log('address 정보:', address);
              
              // 네이버 API v2 구조에서 지역 정보 추출
              let naverAreaInfo = {
                area1: '', // 시도
                area2: '', // 시군구
                area3: '', // 읍면동
                area4: '', // 리
                legal: '', // 법정동
                admin: ''  // 행정동
              };
              
              // results 배열에서 legalcode와 admcode 정보 추출
              if (result.results && Array.isArray(result.results)) {
                result.results.forEach((item: any) => {
                  if (item.name === 'legalcode' && item.region) {
                    // 법정동 정보
                    naverAreaInfo.area1 = item.region.area1?.name || '';
                    naverAreaInfo.area2 = item.region.area2?.name || '';
                    naverAreaInfo.area3 = item.region.area3?.name || '';
                    naverAreaInfo.area4 = item.region.area4?.name || '';
                    naverAreaInfo.legal = item.region.area3?.name || '';
                  } else if (item.name === 'admcode' && item.region) {
                    // 행정동 정보
                    naverAreaInfo.admin = item.region.area3?.name || '';
                  }
                });
              }
              
              // POI 정보 (기존 방식 유지 - 호환성)
              const poiInfo = {
                area1: naverAreaInfo.area1, // 시도
                area2: naverAreaInfo.area2, // 시군구  
                area3: naverAreaInfo.area3, // 읍면동
                area4: naverAreaInfo.area4, // 리
                land: '',   // 지번 (land 정보에서 추출)
                legal: naverAreaInfo.legal, // 법정동
                admin: naverAreaInfo.admin, // 행정동
              };
              
              // 네이버 API의 도로명 주소 상세 정보 추출
              let naverRoadDetails = {
                roadName: '',
                buildingNumber: '',
                buildingName: '',
                zipCode: ''
              };
              
              // results에서 도로명 주소 상세 정보 추출
              if (result.results && Array.isArray(result.results)) {
                result.results.forEach((item: any) => {
                  if (item.land) {
                    if (item.land.name) {
                      naverRoadDetails.roadName = item.land.name; // 도로명
                    }
                    if (item.land.number1) {
                      naverRoadDetails.buildingNumber = item.land.number1; // 건물번호
                    }
                    // addition 정보에서 건물명과 우편번호 추출
                    if (item.land.addition0?.type === 'building') {
                      naverRoadDetails.buildingName = item.land.addition0.value;
                    }
                    if (item.land.addition1?.type === 'zipcode') {
                      naverRoadDetails.zipCode = item.land.addition1.value;
                    }
                  }
                });
              }
              
              console.log('네이버 지역 정보:', naverAreaInfo);
              console.log('네이버 도로명 상세:', naverRoadDetails);
              console.log('POI 정보:', poiInfo);
              
              // 지적 정보 (브이월드 실제 API 데이터 우선 사용)
              const landInfo = {
                jibun: realLandData?.fullAddress || address?.jibunAddress || '정보없음', // 브이월드 실제 지번 주소 우선
                road: realLandData?.vworldFullRoadAddress || address?.roadAddress || '정보없음', // 브이월드 우선, 네이버 도로명 주소
                vworldRoadAddress: realLandData?.vworldFullRoadAddress || '', // 브이월드 완전한 도로명 주소 (실제)
                area: realLandData?.area || '정보없음',
                landType: realLandData?.landType || '정보없음',
                pnu: realLandData?.pnu || generatePNU(address),
                lotNumber: realLandData?.fullJibun || extractLotNumber(address?.jibunAddress),
                landUse: realLandData?.landUse || '정보없음',
                isRealData: !!realLandData && realLandData.isRealData,
                // 추가 세부 정보
                bonbun: realLandData?.bonbun || '',
                bubun: realLandData?.bubun || '',
                adminArea: realLandData ? `${realLandData.sido || ''} ${realLandData.sigungu || ''} ${realLandData.emd || ''}`.trim() : '',
                // POI 정보 추가 (네이버 API v2 구조 활용)
                poiArea1: poiInfo.area1, // 시도
                poiArea2: poiInfo.area2, // 시군구
                poiArea3: poiInfo.area3, // 읍면동
                poiArea4: poiInfo.area4, // 리
                poiLegal: poiInfo.legal, // 법정동
                poiAdmin: poiInfo.admin,  // 행정동
                // 네이버 도로명 주소 상세 정보 (API v2 기준)
                naverRoadName: naverRoadDetails.roadName || '', // 도로명
                naverBuildingNumber: naverRoadDetails.buildingNumber || '', // 건물번호
                naverBuildingName: naverRoadDetails.buildingName || '', // 건물명
                naverZipCode: naverRoadDetails.zipCode || '', // 우편번호
                // 브이월드 도로명 주소 상세 정보 (공식 레퍼런스 기준)
                vworldSido: realLandData?.vworldSido || '',
                vworldSigungu: realLandData?.vworldSigungu || '',
                vworldRoadName: realLandData?.vworldRoadName || '',
                vworldBuildingNo: realLandData?.vworldBuildingNo || '',
                vworldGu: realLandData?.vworldGu || '',
                // 건물 정보 (공식 레퍼런스 기준)
                buildingEngName: realLandData?.buildingEngName || '',
                buildingSubName: realLandData?.buildingSubName || '',
                bdMgtSn: realLandData?.bdMgtSn || '', // 건물관리번호
                // 데이터 출처 구분
                isVWorldJibun: !!realLandData?.fullAddress, // 브이월드 지번 주소 여부
                isVWorldRoad: !!realLandData?.vworldFullRoadAddress, // 브이월드 도로명 주소 여부
                isNaverRoad: !!address?.roadAddress // 네이버 도로명 주소 여부
              };
              
              console.log('토지 정보:', landInfo);
              
              // 정보창 내용 생성
              const contentString = `
                <div class="info-window-content" style="padding: 15px; min-width: 300px; font-family: 'Noto Sans KR', sans-serif; position: relative;">
                  <!-- 닫기 버튼 -->
                  <button onclick="closeInfoWindow()" style="
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #ff4444;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 24px;
                    height: 24px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: bold;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    transition: background-color 0.2s;
                  " onmouseover="this.style.backgroundColor='#cc0000'" onmouseout="this.style.backgroundColor='#ff4444'">&times;</button>
                  
                  <div style="border-bottom: 2px solid ${landInfo.isRealData ? '#4CAF50' : '#FF9800'}; padding-bottom: 8px; margin-bottom: 12px; padding-right: 30px;">
                    <h3 style="margin: 0; color: ${landInfo.isRealData ? '#2E7D32' : '#F57C00'}; font-size: 16px;">
                      ${landInfo.naverBuildingName || '건물명 정보없음'}
                    </h3>
                  </div>
                  
                  <div style="margin-bottom: 12px;">
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">지번 주소:</strong> 
                      <span style="color: ${landInfo.isVWorldJibun ? '#4CAF50' : '#666'};">${landInfo.jibun}</span>
                      ${landInfo.isVWorldJibun ? ' <small style="color: #4CAF50;">(브이월드 실제)</small>' : ' <small style="color: #FF9800;">(네이버 참고)</small>'}
                    </div>
                    ${landInfo.adminArea ? `
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">행정구역:</strong> 
                      <span style="color: #666;">${landInfo.adminArea}</span>
                    </div>
                    ` : ''}
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">도로명 주소:</strong> 
                      <span style="color: #666;">${landInfo.naverRoadName && landInfo.naverBuildingNumber ? `${landInfo.naverRoadName} ${landInfo.naverBuildingNumber}` : '정보없음'}</span>
                      ${landInfo.naverRoadName && landInfo.naverBuildingNumber ? ' <small style="color: #2196F3;">(네이버 상세)</small>' : ' <small style="color: #FF9800;">(정보없음)</small>'}
                      ${landInfo.naverZipCode ? `
                      <br><small style="color: #666;">우편번호: ${landInfo.naverZipCode}</small>
                      ` : ''}
                    </div>
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">필지번호:</strong> 
                      <span style="color: #1976D2; font-weight: bold;">${landInfo.lotNumber}</span>
                      ${landInfo.bonbun || landInfo.bubun ? `
                      <span style="color: #999; font-size: 11px;">(본번: ${landInfo.bonbun || '-'}, 부번: ${landInfo.bubun || '-'})</span>
                      ` : ''}
                    </div>
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">면적:</strong> 
                      <span style="color: ${landInfo.isRealData ? '#4CAF50' : '#FF9800'}; font-weight: bold;">${landInfo.area}</span>
                      ${landInfo.isRealData ? ' <small style="color: #4CAF50;">(실제)</small>' : ' <small style="color: #FF9800;">(참고)</small>'}
                    </div>
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">지목:</strong> 
                      <span style="color: ${landInfo.isRealData ? '#4CAF50' : '#FF9800'}; font-weight: bold;">${landInfo.landType}</span>
                      ${landInfo.isRealData ? ' <small style="color: #4CAF50;">(실제)</small>' : ' <small style="color: #FF9800;">(참고)</small>'}
                    </div>
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">용도지역:</strong> 
                      <span style="color: ${landInfo.isRealData ? '#4CAF50' : '#FF9800'}; font-weight: bold;">${landInfo.landUse}</span>
                      ${landInfo.isRealData ? ' <small style="color: #4CAF50;">(실제)</small>' : ' <small style="color: #FF9800;">(참고)</small>'}
                    </div>
                    ${landInfo.bdMgtSn ? `
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">건물관리번호:</strong> 
                      <span style="color: #999; font-size: 11px;">${landInfo.bdMgtSn}</span>
                    </div>
                    ` : ''}
                    ${realLandData?.jiga ? `
                    <div style="margin-bottom: 6px;">
                      <strong style="color: #424242;">공시지가:</strong> 
                      <span style="color: #E91E63; font-weight: bold;">${realLandData.jiga}</span>
                      <small style="color: #4CAF50;">(${realLandData.gosi_year || ''}년 ${realLandData.gosi_month || ''}월 기준)</small>
                    </div>
                    ` : ''}
                    <div style="margin-bottom: 12px;">
                      <strong style="color: #424242;">PNU:</strong> 
                      <span style="color: #666; font-size: 11px;">${landInfo.pnu}</span>
                    </div>
                  </div>
                  
                  <div style="text-align: center; margin-top: 8px; font-size: 10px; color: #999;">
                    ${landInfo.isRealData ? 
                      '※ 브이월드 API 기반 정확한 지적도 데이터입니다.' : 
                      '※ 네이버 지도 기반 참고용 정보입니다. 정확한 데이터는 브이월드 API 연동 후 확인 가능합니다.'
                    }
                  </div>
                </div>
              `;
              
              // 정보창 생성 및 표시
              currentInfoWindow = new window.naver.maps.InfoWindow({
                content: contentString,
                position: latlng,
                backgroundColor: "#fff",
                borderColor: landInfo.isRealData ? "#4CAF50" : "#FF9800",
                borderWidth: 2,
                anchorSize: new window.naver.maps.Size(10, 10),
                pixelOffset: new window.naver.maps.Point(0, -10)
              });
              
              // 정보창 닫기 함수를 전역으로 등록
              (window as any).closeInfoWindow = function() {
                if (currentInfoWindow) {
                  currentInfoWindow.close();
                  currentInfoWindow = null;
                }
                if (currentPolygon) {
                  currentPolygon.setMap(null);
                  currentPolygon = null;
                }
              };
              
              currentInfoWindow.open(map);
            });
          });
        });

        // 지도 외부 클릭 시 정보창 닫기 이벤트 추가
        window.naver.maps.Event.addListener(map, 'click', function(e: any) {
          // 정보창이 열려있고, 클릭된 곳이 정보창이 아닌 경우에만 닫기
          setTimeout(() => {
            const clickedElement = e.originalEvent?.target;
            const isInfoWindowClick = clickedElement?.closest('.info-window-content');
            
            if (currentInfoWindow && !isInfoWindowClick) {
              // 새로운 위치 클릭이므로 기존 정보창과 경계선 제거는 
              // 위의 클릭 이벤트에서 이미 처리됨
            }
          }, 100);
        });

        // ESC 키로 정보창 닫기
        document.addEventListener('keydown', function(e) {
          if (e.key === 'Escape' && currentInfoWindow) {
            (window as any).closeInfoWindow();
          }
        });

        // 토지 경계선 그리기 함수
        function drawLandBoundary(geometry: any, isRealData: boolean) {
          if (!geometry || !geometry.coordinates) {
            console.log('경계선 데이터가 없습니다.');
            return;
          }

          try {
            // GeoJSON 좌표를 네이버 지도 좌표로 변환
            const coordinates = geometry.coordinates;
            let paths: any[] = [];

            if (geometry.type === 'Polygon') {
              // Polygon 타입인 경우
              const ring = coordinates[0]; // 외곽선만 사용
              paths = ring.map((coord: number[]) => 
                new window.naver.maps.LatLng(coord[1], coord[0]) // [경도, 위도] -> [위도, 경도]
              );
            } else if (geometry.type === 'MultiPolygon') {
              // MultiPolygon 타입인 경우 첫 번째 폴리곤만 사용
              const ring = coordinates[0][0];
              paths = ring.map((coord: number[]) => 
                new window.naver.maps.LatLng(coord[1], coord[0])
              );
            }

            if (paths.length > 0) {
              // 토지 경계선 폴리곤 생성
              currentPolygon = new window.naver.maps.Polygon({
                map: map,
                paths: paths,
                fillColor: isRealData ? '#4CAF50' : '#FF9800',
                fillOpacity: 0.2,
                strokeColor: isRealData ? '#2E7D32' : '#F57C00',
                strokeOpacity: 0.8,
                strokeWeight: 3,
                strokeStyle: 'solid'
              });

              console.log(`토지 경계선 표시 완료 (${isRealData ? '실제 데이터' : '참고 데이터'})`);
              
              // 자동 확대 기능 제거 (사용자 요청)
              // const bounds = new window.naver.maps.LatLngBounds();
              // paths.forEach(path => bounds.extend(path));
              // map.fitBounds(bounds);
            }
          } catch (error) {
            console.warn('토지 경계선 그리기 오류:', error);
          }
        }

        // 브이월드 API 2.0을 사용한 실제 지적도 정보 조회
        async function getRealLandInfo(lng: number, lat: number) {
          const vworldApiKey = import.meta.env.VITE_VWORLD_API_KEY || 'DEMO_KEY';
          const currentDomain = window.location.origin; // 현재 도메인과 포트를 동적으로 가져오기
          
          try {
            // 1. 연속지적도 정보 조회 (브이월드 API 2.0 레퍼런스 기준)
            const cadastralUrl = `/api/vworld/req/data?service=data&version=2.0&request=GetFeature&data=LP_PA_CBND_BUBUN&key=${vworldApiKey}&domain=${currentDomain}&geometry=true&attribute=true&crs=EPSG:4326&geomFilter=POINT(${lng}%20${lat})&buffer=5&format=json`;
            
            console.log('브이월드 연속지적도 API 2.0 조회 중...', { lng, lat });
            const cadastralResponse = await fetch(cadastralUrl);
            const cadastralData = await cadastralResponse.json();
            
            console.log('브이월드 연속지적도 API 2.0 응답:', cadastralData);
            
            let landData: any = null;
            
            // 연속지적도에서 정확한 지번 정보 추출 (API 2.0 레퍼런스 기준)
            if (cadastralData.response?.status === 'OK' && 
                cadastralData.response?.result?.featureCollection?.features?.length > 0) {
              
              const feature = cadastralData.response.result.featureCollection.features[0];
              const props = feature.properties;
              
              landData = {
                // API 2.0 레퍼런스 기준 속성명 사용
                pnu: props.pnu || '', // 19자리 PNU
                jibun: props.jibun || '', // 지번 (예: 2-1대)
                bonbun: props.bonbun || '', // 본번
                bubun: props.bubun || '', // 부번
                addr: props.addr || '', // 주소
                gosi_year: props.gosi_year || '', // 기준년
                gosi_month: props.gosi_month || '', // 기준월
                jiga: props.jiga || '', // 지가
                emdCd: props.emdCd || '', // 읍면동 코드
                geometry: feature.geometry, // ag_geom (POLYGON 데이터)
                isRealData: true, // 브이월드 실제 데이터임을 표시
                
                // 행정구역 정보 추출 (props.addr에서)
                sido: props.addr ? props.addr.split(' ')[0] || '' : '',
                sigungu: props.addr ? props.addr.split(' ')[1] || '' : '',
                emd: props.addr ? props.addr.split(' ')[2] || '' : '',
                
                // 완전한 지번 주소 생성
                fullJibun: props.jibun || '정보없음',
                fullAddress: props.addr || '정보없음' // 브이월드 실제 지번 주소
              };
              
              console.log('브이월드 연속지적도 정보 추출 성공:', landData);
            } else {
              console.log('브이월드 연속지적도 정보 없음 - 응답:', cadastralData);
            }
            
            // 2. 토지특성정보 조회 (지목, 면적 등 추가 정보)
            if (landData && landData.pnu) {
              try {
                // PNU를 이용한 토지특성정보 조회
                const landCharUrl = `/api/vworld/req/data?service=data&version=2.0&request=GetFeature&data=LP_PA_CBND_BUBUN&key=${vworldApiKey}&domain=${currentDomain}&geometry=false&attribute=true&crs=EPSG:4326&attrFilter=pnu:=:${landData.pnu}&format=json`;
                
                console.log('브이월드 토지특성 API 조회 중...', { pnu: landData.pnu });
                const landCharResponse = await fetch(landCharUrl);
                const landCharData = await landCharResponse.json();
                
                console.log('브이월드 토지특성 API 응답:', landCharData);
                
                if (landCharData.response?.status === 'OK' && 
                    landCharData.response?.result?.featureCollection?.features?.length > 0) {
                  
                  const charFeature = landCharData.response.result.featureCollection.features[0];
                  const charProps = charFeature.properties;
                  
                  // 추가 토지특성 정보 병합
                  landData.area = charProps.area ? `${Math.round(charProps.area * 100) / 100}㎡` : '정보없음';
                  landData.landType = charProps.jimok || charProps.jimok_nm || '정보없음'; // 지목
                  landData.landUse = charProps.spfc || charProps.uq_nm || '정보없음'; // 용도지역
                  
                  console.log('토지특성 정보 병합 완료:', landData);
                }
              } catch (error) {
                console.warn('토지특성 정보 조회 오류:', error);
              }
            }
            
            // 4. 토지특성조사 정보 조회 (정확한 지목, 면적 정보)
            if (landData && landData.pnu) {
              try {
                // 토지특성조사 데이터로 지목, 면적 등 상세 정보 조회
                const landSurveyUrl = `/api/vworld/req/data?service=data&version=2.0&request=GetFeature&data=LP_PA_CBND_BUBUN&key=${vworldApiKey}&domain=${currentDomain}&geometry=false&attribute=true&crs=EPSG:4326&attrFilter=pnu:=:${landData.pnu}&columns=pnu,jibun,bonbun,bubun,addr,gosi_year,gosi_month,jiga&format=json`;
                
                console.log('브이월드 토지특성조사 API 조회 중...', { pnu: landData.pnu });
                const surveyResponse = await fetch(landSurveyUrl);
                const surveyData = await surveyResponse.json();
                
                console.log('브이월드 토지특성조사 API 응답:', surveyData);
                
                if (surveyData.response?.status === 'OK' && 
                    surveyData.response?.result?.featureCollection?.features?.length > 0) {
                  
                  const surveyFeature = surveyData.response.result.featureCollection.features[0];
                  const surveyProps = surveyFeature.properties;
                  
                  // 상세 토지 정보 보완
                  if (surveyProps.jiga) {
                    landData.jiga = `${parseInt(surveyProps.jiga).toLocaleString()}원/㎡`;
                  }
                  
                  console.log('토지특성조사 정보 추가 완료:', landData);
                }
              } catch (error) {
                console.warn('토지특성조사 정보 조회 오류:', error);
              }
            }
            
            // 5. 용도지역 정보 조회 (토지이용계획)
            if (landData) {
              try {
                const landUseUrl = `/api/vworld/req/data?service=data&version=2.0&request=GetFeature&data=LT_C_UQ111&key=${vworldApiKey}&domain=${currentDomain}&geometry=false&attribute=true&crs=EPSG:4326&geomFilter=POINT(${lng}%20${lat})&buffer=10&format=json`;
                
                console.log('브이월드 용도지역 API 조회 중...');
                const landUseResponse = await fetch(landUseUrl);
                const landUseData = await landUseResponse.json();
                
                console.log('브이월드 용도지역 API 응답:', landUseData);
                
                if (landUseData.response?.status === 'OK' && 
                    landUseData.response?.result?.featureCollection?.features?.length > 0) {
                  
                  const landUseFeature = landUseData.response.result.featureCollection.features[0];
                  const landUseProps = landUseFeature.properties;
                  
                  landData.landUse = landUseProps.uq_nm || landUseProps.UQ_NM || landUseProps.spfc || landUseProps.SPFC || '정보없음';
                  
                  console.log('용도지역 정보 추가 완료:', landData);
                }
              } catch (error) {
                console.warn('용도지역 정보 조회 오류:', error);
              }
            }
            
            // 6. 도로명주소 건물정보 조회 (브이월드 공식 레퍼런스 기준)
            if (landData) {
              try {
                // 도로명주소 건물 API - LT_C_SPBD 사용
                const buildingUrl = `/api/vworld/req/data?service=data&version=2.0&request=GetFeature&data=LT_C_SPBD&key=${vworldApiKey}&domain=${currentDomain}&geometry=false&attribute=true&crs=EPSG:4326&geomFilter=POINT(${lng}%20${lat})&buffer=50&format=json`;
                
                console.log('브이월드 도로명주소 건물정보 API 조회 중...');
                const buildingResponse = await fetch(buildingUrl);
                const buildingData = await buildingResponse.json();
                
                console.log('브이월드 도로명주소 건물정보 API 응답:', buildingData);
                
                if (buildingData.response?.status === 'OK' && 
                    buildingData.response?.result?.featureCollection?.features?.length > 0) {
                  
                  const buildingFeature = buildingData.response.result.featureCollection.features[0];
                  const buildingProps = buildingFeature.properties;
                  
                  // 건물 정보 추가 (공식 레퍼런스 속성명 사용)
                  landData.buildingName = buildingProps.buld_nm || ''; // 건물명칭
                  landData.buildingEngName = buildingProps.bul_eng_nm || ''; // 건물영문명칭
                  landData.buildingSubName = buildingProps.buld_nm_dc || ''; // 건물부명칭
                  landData.floorCount = buildingProps.gro_flo_co || ''; // 건물층수(지상)
                  
                  // 도로명 주소 정보 (공식 레퍼런스 속성명 사용)
                  landData.vworldSido = buildingProps.sido || ''; // 시도명
                  landData.vworldSigungu = buildingProps.sigungu || ''; // 시군구명
                  landData.vworldRoadName = buildingProps.rd_nm || ''; // 도로명
                  landData.vworldBuildingNo = buildingProps.buld_no || ''; // 건물번호
                  landData.vworldGu = buildingProps.gu || ''; // 읍면명칭
                  landData.emdCd = buildingProps.emdCd || ''; // 읍면동 코드
                  landData.bdMgtSn = buildingProps.bd_mgt_sn || ''; // 건물관리번호
                  
                  // 완전한 도로명 주소 구성
                  if (landData.vworldSido && landData.vworldSigungu && landData.vworldRoadName && landData.vworldBuildingNo) {
                    landData.vworldFullRoadAddress = `${landData.vworldSido} ${landData.vworldSigungu} ${landData.vworldGu ? landData.vworldGu + ' ' : ''}${landData.vworldRoadName} ${landData.vworldBuildingNo}`;
                  }
                  
                  console.log('도로명주소 건물정보 추가 완료:', landData);
                } else {
                  // 대안: 건물관리번호로 재시도 (버퍼 확장)
                  try {
                    const altBuildingUrl = `/api/vworld/req/data?service=data&version=2.0&request=GetFeature&data=LT_C_SPBD&key=${vworldApiKey}&domain=${currentDomain}&geometry=false&attribute=true&crs=EPSG:4326&geomFilter=POINT(${lng}%20${lat})&buffer=100&format=json`;
                    
                    console.log('브이월드 대안 도로명주소 건물정보 API 조회 중...');
                    const altBuildingResponse = await fetch(altBuildingUrl);
                    const altBuildingData = await altBuildingResponse.json();
                    
                    console.log('브이월드 대안 도로명주소 건물정보 API 응답:', altBuildingData);
                    
                    if (altBuildingData.response?.status === 'OK' && 
                        altBuildingData.response?.result?.featureCollection?.features?.length > 0) {
                      
                      const altFeature = altBuildingData.response.result.featureCollection.features[0];
                      const altProps = altFeature.properties;
                      
                      // 건물 정보 추가 (공식 레퍼런스 속성명 사용)
                      landData.buildingName = altProps.buld_nm || '';
                      landData.buildingEngName = altProps.bul_eng_nm || '';
                      landData.buildingSubName = altProps.buld_nm_dc || '';
                      landData.floorCount = altProps.gro_flo_co || '';
                      
                      // 도로명 주소 정보
                      landData.vworldSido = altProps.sido || '';
                      landData.vworldSigungu = altProps.sigungu || '';
                      landData.vworldRoadName = altProps.rd_nm || '';
                      landData.vworldBuildingNo = altProps.buld_no || '';
                      landData.vworldGu = altProps.gu || '';
                      
                      // 완전한 도로명 주소 구성
                      if (landData.vworldSido && landData.vworldSigungu && landData.vworldRoadName && landData.vworldBuildingNo) {
                        landData.vworldFullRoadAddress = `${landData.vworldSido} ${landData.vworldSigungu} ${landData.vworldGu ? landData.vworldGu + ' ' : ''}${landData.vworldRoadName} ${landData.vworldBuildingNo}`;
                      }
                      
                      console.log('대안 도로명주소 건물정보 추가 완료:', landData);
                    }
                  } catch (altError) {
                    console.warn('대안 도로명주소 건물정보 조회 오류:', altError);
                  }
                }
              } catch (error) {
                console.warn('건물정보 조회 오류:', error);
              }
            }
            
            return landData; // null이거나 실제 데이터 반환
            
          } catch (error) {
            console.warn('브이월드 API 2.0 오류:', error);
            return null;
          }
        }

        // PNU(필지고유번호) 생성 함수
        function generatePNU(_address: any): string {
          // 실제로는 행정구역코드 + 필지번호로 구성
          // 여기서는 시연용으로 임의 생성
          const regionCode = '3017010300'; // 대전 서구 예시
          const lotCode = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
          return `${regionCode}${lotCode}`;
        }

        // 필지번호 추출 함수
        function extractLotNumber(jibunAddress: string): string {
          if (!jibunAddress) return '정보없음';
          
          // 지번 주소에서 번지 추출 (예: "대전광역시 서구 둔산동 123-45" -> "123-45")
          const match = jibunAddress.match(/(\d+(-\d+)?)\s*$/);
          return match ? match[1] : '정보없음';
        }

        // 인증 실패 처리 함수 추가
        (window as any).navermap_authFailure = function () {
          console.error('네이버 지도 API 인증 실패');
          console.error('클라이언트 ID와 웹 서비스 URL을 확인 필요');
        };

        console.log('네이버 지도 기본 예제 생성 완료', map);
        console.log('지적도 레이어 추가 완료');
        console.log('클릭 이벤트 기능 추가 완료');
        console.log('중심좌표: 대전시청 (36.3504, 127.3845)');
        console.log('줌 레벨: 16');
        console.log('지도를 클릭하면 토지 정보가 표시됩니다.');
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        console.error('지도 초기화 중 오류 발생:', error);
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
    <div className="w-full h-screen relative">
      {/* 컨트롤 패널 */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3 space-y-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">지도 설정</div>
        
        {/* 지적도 토글 */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => (window as any).toggleCadastral?.()}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isCadastralMode 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isCadastralMode ? '지적도 ON' : '지적도 OFF'}
          </button>
        </div>

        {/* 위성 모드 토글 */}
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => (window as any).toggleSatellite?.()}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              isSatelliteMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {isSatelliteMode ? '위성 ON' : '위성 OFF'}
          </button>
        </div>
      </div>

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
