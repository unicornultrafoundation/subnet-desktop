import { TextInput, TextInputProps } from "flowbite-react";
import merge from "lodash/merge";

export default function Input(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      theme={merge(
        {
          field: {
            base: "relative w-full",
            icon: {
              svg: "h-6 w-6 text-gray-400 peer-focus:text-primary-500",
            },
            input: {
              colors: {
                gray: "border-transparent bg-[#1F2225] text-white placeholder-neutral-700 focus:border-white focus:ring-white",
                error:
                  "border-transparent bg-[#1F2225] text-white placeholder-neutral-700 focus:border-white focus:ring-white",
              },
            },
          },
        },
        props.theme,
      )}
    />
  );
}
