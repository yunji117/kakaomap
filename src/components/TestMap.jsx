import { useState } from 'react'

const TestMap = () => {
  const [selectedMap, setSelectedMap] = useState('demo')

  return (
    <div className="w-full h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">지도 테스트</h1>
      
      <div className="mb-4">
        <button 
          onClick={() => setSelectedMap('demo')}
          className={`mr-2 px-4 py-2 rounded ${selectedMap === 'demo' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          데모 맵
        </button>
        <button 
          onClick={() => setSelectedMap('iframe')}
          className={`mr-2 px-4 py-2 rounded ${selectedMap === 'iframe' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Google Maps 임베드
        </button>
      </div>

      {selectedMap === 'demo' && (
        <div className="w-full h-96 bg-green-100 border-2 border-green-300 rounded-lg flex items-center justify-center relative">
          <div className="text-center">
            <div className="text-4xl mb-2">🗺️</div>
            <h2 className="text-lg font-semibold text-green-800">데모 지도</h2>
            <p className="text-green-600">서울시 중심</p>
            <div className="absolute top-4 left-4 bg-white p-2 rounded shadow">
              <p className="text-sm">위도: 37.5665</p>
              <p className="text-sm">경도: 126.9780</p>
            </div>
            <div className="absolute top-4 right-4 bg-white p-2 rounded shadow">
              <p className="text-sm">줌 레벨: 3</p>
            </div>
          </div>
        </div>
      )}

      {selectedMap === 'iframe' && (
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d50625.78981761052!2d126.94664738232422!3d37.566495!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x357ca28b61c565cd%3A0x858aedb4e4ea83eb!2z7ISc7Jq47Yq567OE7IucIOykgOq1rOyLnA!5e0!3m2!1sko!2skr!4v1642384850123!5m2!1sko!2skr"
          width="100%"
          height="384"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="rounded-lg"
        ></iframe>
      )}
      
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="font-semibold text-yellow-800 mb-2">카카오맵 사용을 위한 설정:</h3>
        <ol className="text-sm text-yellow-700 space-y-1">
          <li>1. <a href="https://developers.kakao.com/" target="_blank" className="underline">developers.kakao.com</a> 접속</li>
          <li>2. 내 애플리케이션 → 애플리케이션 추가하기</li>
          <li>3. 앱 키 → JavaScript 키 복사</li>
          <li>4. 플랫폼 → Web 플랫폼 등록 → <code className="bg-yellow-100 px-1">http://localhost:5173</code> 추가</li>
          <li>5. .env 파일의 API 키 교체 후 서버 재시작</li>
        </ol>
      </div>
    </div>
  )
}

export default TestMap
