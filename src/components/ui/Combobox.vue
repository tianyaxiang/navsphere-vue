<template>
  <Combobox v-model="selected" @update:model-value="$emit('update:modelValue', $event)">
    <div class="relative">
      <div class="relative w-full cursor-default overflow-hidden rounded-lg bg-background text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm">
        <ComboboxInput
          :class="cn(
            'w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-foreground focus:ring-0 bg-transparent',
            inputClass
          )"
          :display-value="displayValue"
          :placeholder="placeholder"
          @change="query = $event.target.value"
        />
        <ComboboxButton class="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronsUpDownIcon class="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        </ComboboxButton>
      </div>
      <TransitionRoot
        leave="transition ease-in duration-100"
        leave-from="opacity-100"
        leave-to="opacity-0"
        @after-leave="query = ''"
      >
        <ComboboxOptions
          :class="cn(
            'absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-popover py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50',
            optionsClass
          )"
        >
          <div
            v-if="filteredOptions.length === 0 && query !== ''"
            class="relative cursor-default select-none py-2 px-4 text-muted-foreground"
          >
            {{ noResultsText }}
          </div>

          <ComboboxOption
            v-for="option in filteredOptions"
            :key="getOptionKey(option)"
            v-slot="{ selected, active }"
            as="template"
            :value="option"
          >
            <li
              :class="cn(
                'relative cursor-default select-none py-2 pl-10 pr-4',
                active ? 'bg-accent text-accent-foreground' : 'text-foreground'
              )"
            >
              <span
                :class="cn(
                  'block truncate',
                  selected ? 'font-medium' : 'font-normal'
                )"
              >
                {{ getOptionLabel(option) }}
              </span>
              <span
                v-if="selected"
                class="absolute inset-y-0 left-0 flex items-center pl-3 text-accent-foreground"
              >
                <CheckIcon class="h-5 w-5" aria-hidden="true" />
              </span>
            </li>
          </ComboboxOption>
        </ComboboxOptions>
      </TransitionRoot>
    </div>
  </Combobox>
</template>

<script setup lang="ts" generic="T">
import { ref, computed } from 'vue'
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  TransitionRoot,
} from '@headlessui/vue'
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-vue-next'
import { cn } from '@/utils'

interface Props {
  modelValue?: T
  options: T[]
  placeholder?: string
  noResultsText?: string
  inputClass?: string
  optionsClass?: string
  displayValue?: (option: T) => string
  getOptionKey?: (option: T) => string | number
  getOptionLabel?: (option: T) => string
  filterFunction?: (options: T[], query: string) => T[]
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '请选择...',
  noResultsText: '没有找到结果',
  displayValue: (option: T) => String(option),
  getOptionKey: (option: T) => String(option),
  getOptionLabel: (option: T) => String(option),
  filterFunction: (options: T[], query: string) => {
    return query === ''
      ? options
      : options.filter((option) =>
          String(option)
            .toLowerCase()
            .replace(/\s+/g, '')
            .includes(query.toLowerCase().replace(/\s+/g, ''))
        )
  },
})

defineEmits<{
  'update:modelValue': [value: T]
}>()

const selected = ref(props.modelValue)
const query = ref('')

const filteredOptions = computed(() =>
  props.filterFunction(props.options, query.value)
)
</script>