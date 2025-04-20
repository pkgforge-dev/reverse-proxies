```bash
zig build-exe "./zdl.zig" \
   -target "native-native-musl" \
   -O "ReleaseSmall" \
   -fsingle-threaded \
   -fstrip \
   -fno-unwind-tables \
   -fno-stack-check \
   -fno-PIE \
   -flto
```   