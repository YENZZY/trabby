// 테스트에서만 쓰는 가짜 저장소: zustand / AsyncStorage 를 간단한 메모리 버전으로 바꿔 끼워요 (앱 코드는 그대로 테스트)
const Module = require('module');
const path = require('path');
const map = { zustand: 'zustand.js', 'zustand/middleware': 'zustand-middleware.js', '@react-native-async-storage/async-storage': 'async-storage.js' };
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (map[request]) return path.join(__dirname, 'shims', map[request]);
  return orig.call(this, request, ...rest);
};
