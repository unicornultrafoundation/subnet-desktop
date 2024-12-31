import { useState } from "react";
import Modal from "../Modal";
import Button from "../Button";
import CONFIG from "@/assets/images/config.png";
import { App } from "@/interface/app";
import SettingIcon from "../Icon/SettingIcon";
import Input from "../Input";
import IconPlus from "../Icon/IconPlus";
import { useSaveAppEnv } from "@/hooks/useSaveAppEnv";
import useToastNotification from "@/hooks/useToastNotification";

export default function EnvModal({ appDetails }: { appDetails: App }) {
  const [showModal, setShowModal] = useState(false);

  const { showToast } = useToastNotification();
  const { mutate } = useSaveAppEnv(
    appDetails.id,
    () => {
      showToast("Saved successfully", "success");
      setShowModal(false);
    },
    () => {
      showToast("Failed to save app env", "error");
    },
  );

  const config = appDetails.metadata.containerConfig.env || {};
  const [configArray, setConfigArray] = useState(
    Object.keys(config).map((key) => {
      return {
        key,
        value: config[key],
      };
    }),
  );

  const handleAddRow = () => {
    const newArr = [...configArray, ...[{ key: "", value: "" }]];
    setConfigArray(newArr);
  };

  const handleSaveEnv = () => {
    const filteredEnv = configArray.filter((item) => {
      if (!item.key && !item.value) return false;
      return true;
    });
    setConfigArray(filteredEnv);

    const finalConfig = filteredEnv.reduce(
      (pre, cur) => {
        pre[cur.key] = cur.value;
        return pre;
      },
      {} as Record<string, any>,
    );

    mutate(finalConfig);
  };

  return (
    <Modal
      visible={showModal}
      size="2xl"
      setVisible={setShowModal}
      trigger={(onClick) => {
        return (
          <Button type="secondary" onClick={onClick}>
            <SettingIcon />
          </Button>
        );
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <img src={CONFIG} className="h-[80px] w-[80px]" />
        <div className="flex flex-col gap-[2px] text-center">
          <h2>Setup environemnt</h2>
          <span className="body-lg text-neutral-700">
            Enter env for application below
          </span>
        </div>
        <div className="flex w-full flex-col items-center rounded-2xl border-[1px] border-neutral-900">
          <div className="flex max-h-[300px] w-full flex-col gap-4 overflow-y-auto p-6">
            {configArray.map((item, index) => {
              return (
                <div className="flex w-full gap-6" key={`config-env-${index}`}>
                  <div className="flex flex-1 flex-col items-start gap-3">
                    <span className="caption text-neutral-700">KEY</span>
                    <Input
                      value={item.key}
                      onChange={(e) => {
                        const _cur = [...configArray];
                        _cur[index].key = e.target.value;
                        setConfigArray(_cur);
                      }}
                      className="w-full"
                      theme={{
                        field: {
                          input: {
                            colors: {
                              gray: "border-transparent bg-neutral-900 text-white placeholder-neutral-700 focus:border-white focus:ring-white",
                              error:
                                "border-transparent bg-neutral-900 text-white placeholder-neutral-700 focus:border-white focus:ring-white",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                  <div className="flex flex-1 flex-col items-start gap-3">
                    <span className="caption text-neutral-700">VALUE</span>
                    <Input
                      value={item.value}
                      onChange={(e) => {
                        const _cur = [...configArray];
                        _cur[index].value = e.target.value;
                        setConfigArray(_cur);
                      }}
                      className="w-full"
                      theme={{
                        field: {
                          input: {
                            colors: {
                              gray: "border-transparent bg-neutral-900 text-white placeholder-neutral-700 focus:border-white focus:ring-white",
                              error:
                                "border-transparent bg-neutral-900 text-white placeholder-neutral-700 focus:border-white focus:ring-white",
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="h-[1px] w-full bg-neutral-900" />
          <button
            onClick={handleAddRow}
            className="flex items-center justify-center gap-2 py-4 text-primary-500"
          >
            <IconPlus />
            <span>Add new variable</span>
          </button>
        </div>
        <div className="flex w-full gap-[16px]">
          <Button fill type="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button fill type="primary" onClick={() => handleSaveEnv()}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
