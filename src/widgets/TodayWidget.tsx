import type { Color } from '@expo/ui/swift-ui/modifiers';
import {
  containerBackground,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  padding,
  progressViewStyle,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { HStack, ProgressView, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { TodayWidgetProps } from './TodayWidgetProps';

function TodayWidget(props: TodayWidgetProps, environment: WidgetEnvironment) {
  'widget';
  const maxRowsMedium = 4;
  const maxRowsLarge = 7;
  const dark = environment.colorScheme === 'dark';
  const bg: Color = dark ? '#0F172A' : '#FFFFFF';
  const primary: Color = dark ? '#F1F5F9' : '#0F172A';
  const secondary: Color = dark ? '#94A3B8' : '#64748B';
  const accent: Color = dark ? '#818CF8' : '#4338CA';
  const doneMark: Color = dark ? '#34D399' : '#16A34A';
  const remaining = props.total - props.done;
  const ratio = props.total === 0 ? 0 : props.done / props.total;

  const Row = (habit: TodayWidgetProps['habits'][number]) => (
    <HStack spacing={6}>
      <Text modifiers={[font({ design: 'rounded', size: 15 })]}>{habit.emoji}</Text>
      <Text
        modifiers={[
          font({ weight: 'medium', design: 'rounded', size: 14 }),
          foregroundStyle(primary),
          lineLimit(1),
        ]}>
        {habit.name}
      </Text>
      <Spacer />
      <Text
        modifiers={[
          font({ weight: 'heavy', design: 'rounded', size: 14 }),
          foregroundStyle(habit.done ? doneMark : secondary),
        ]}>
        {habit.done ? '✓' : '○'}
      </Text>
    </HStack>
  );

  if (environment.widgetFamily === 'systemSmall') {
    return (
      <VStack
        spacing={6}
        modifiers={[padding({ all: 16 }), containerBackground(bg, 'widget')]}>
        <Text
          modifiers={[
            font({ weight: 'semibold', design: 'rounded', size: 12 }),
            foregroundStyle(secondary),
          ]}>
          BLUEPRINT
        </Text>
        <Text
          modifiers={[font({ weight: 'bold', design: 'rounded', size: 32 }), foregroundStyle(primary)]}>
          {props.done}/{props.total}
        </Text>
        <ProgressView
          value={ratio}
          modifiers={[
            progressViewStyle('circular'),
            tint(accent),
            frame({ width: 48, height: 48, minWidth: 48, minHeight: 48 }),
          ]}
        />
        <Spacer />
        {props.streak > 0 ? (
          <Text
            modifiers={[
              font({ weight: 'medium', design: 'rounded', size: 13 }),
              foregroundStyle(accent),
            ]}>
            🔥 {props.streak} day streak
          </Text>
        ) : (
          <Text
            modifiers={[
              font({ weight: 'medium', design: 'rounded', size: 13 }),
              foregroundStyle(secondary),
            ]}>
            {remaining === 0 ? 'All done' : `${remaining} left`}
          </Text>
        )}
      </VStack>
    );
  }

  if (environment.widgetFamily === 'systemMedium') {
    return (
      <HStack
        spacing={12}
        modifiers={[padding({ all: 16 }), containerBackground(bg, 'widget')]}>
        <VStack spacing={8}>
          <ProgressView
            value={ratio}
            modifiers={[
              progressViewStyle('circular'),
              tint(accent),
              frame({ width: 56, height: 56, minWidth: 56, minHeight: 56 }),
            ]}
          />
          <Text
            modifiers={[
              font({ weight: 'medium', design: 'rounded', size: 12 }),
              foregroundStyle(secondary),
            ]}>
            {remaining === 0 ? 'All done 🎉' : `${remaining} left`}
          </Text>
        </VStack>
        <VStack spacing={5}>
          <HStack spacing={8}>
            <Text
              modifiers={[
                font({ weight: 'bold', design: 'rounded', size: 17 }),
                foregroundStyle(primary),
              ]}>
              {props.done}/{props.total} today
            </Text>
            <Spacer />
            {props.streak > 0 && (
              <Text
                modifiers={[
                  font({ weight: 'semibold', design: 'rounded', size: 15 }),
                  foregroundStyle(secondary),
                ]}>
                🔥 {props.streak}
              </Text>
            )}
          </HStack>
          {props.habits.slice(0, maxRowsMedium).map((habit) => (
            <HStack key={habit.id} spacing={0}>
              {Row({ ...habit })}
            </HStack>
          ))}
        </VStack>
      </HStack>
    );
  }

  return (
    <VStack
      spacing={10}
      modifiers={[padding({ all: 16 }), containerBackground(bg, 'widget')]}>
      <HStack spacing={8}>
        <Text
          modifiers={[
            font({ weight: 'bold', design: 'rounded', size: 17 }),
            foregroundStyle(secondary),
          ]}>
          TODAY
        </Text>
        <Spacer />
        {props.streak > 0 && (
          <Text
            modifiers={[
              font({ weight: 'semibold', design: 'rounded', size: 15 }),
              foregroundStyle(secondary),
            ]}>
            🔥 {props.streak} day streak
          </Text>
        )}
      </HStack>
      <HStack spacing={8}>
        <Text
          modifiers={[font({ weight: 'bold', design: 'rounded', size: 26 }), foregroundStyle(primary)]}>
          {props.done}/{props.total}
        </Text>
        <Text
          modifiers={[
            font({ weight: 'medium', design: 'rounded', size: 14 }),
            foregroundStyle(secondary),
          ]}>
          habits done
        </Text>
      </HStack>
      <ProgressView
        value={ratio}
        modifiers={[
          progressViewStyle('linear'),
          tint(accent),
          frame({ minHeight: 6, alignment: 'leading' }),
        ]}
      />
      <VStack spacing={5}>
        {props.habits.slice(0, maxRowsLarge).map((habit) => (
          <HStack key={habit.id} spacing={0}>
            {Row({ ...habit })}
          </HStack>
        ))}
      </VStack>
    </VStack>
  );
}

export default createWidget('TodayWidget', TodayWidget);
