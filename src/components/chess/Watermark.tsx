import { useAppVersion } from "@/hooks/useAppVersion";

export function WatermarkText() {
  const version = useAppVersion();
  return (
    <>
      made by 4ksh2574 · {version}
    </>
  );
}
