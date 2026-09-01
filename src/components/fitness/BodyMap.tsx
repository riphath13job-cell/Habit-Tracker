import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Ellipse, Path, Rect } from 'react-native-svg';
import {
  MUSCLE_COLORS,
  MUSCLE_OUTLINE,
  RECOVERING_COLOR,
  RECOVERING_EDGE,
  type MuscleKey,
} from '../../fitness/muscle-data';
import { useTheme } from '../../theme';

export type MuscleStatus = Partial<Record<MuscleKey, number>>;

interface Paint {
  fill: string;
  stroke: string;
  strokeWidth?: number;
  strokeLinejoin?: 'round' | 'miter' | 'bevel';
  onPress?: () => void;
}

export function BodyMap({
  status,
  onSelect,
}: {
  status: MuscleStatus;
  onSelect: (muscle: MuscleKey) => void;
}) {
  const theme = useTheme();

  function paint(muscle: MuscleKey): Paint {
    const frac = Math.max(0, Math.min(1, status[muscle] ?? 0));
    const recovering = frac > 0;
    return {
      fill: recovering ? RECOVERING_COLOR : (MUSCLE_COLORS[muscle] ?? theme.card),
      stroke: recovering ? RECOVERING_EDGE : MUSCLE_OUTLINE,
      strokeWidth: 2.5,
      strokeLinejoin: 'round',
      onPress: () => onSelect(muscle),
    };
  }

  const deco = { fill: theme.chipBg, stroke: MUSCLE_OUTLINE, strokeWidth: 2 };

  return (
    <View style={styles.row}>
      <View style={styles.figureWrap}>
        <Svg viewBox="0 0 200 440" style={styles.svg}>
          <Rect x={58} y={72} width={84} height={162} rx={32} {...deco} />
          <Rect x={30} y={104} width={22} height={132} rx={11} {...deco} transform="rotate(6 41 170)" />
          <Rect x={148} y={104} width={22} height={132} rx={11} {...deco} transform="rotate(-6 159 170)" />
          <Rect x={62} y={222} width={34} height={106} rx={16} {...deco} />
          <Rect x={104} y={222} width={34} height={106} rx={16} {...deco} />

          <Circle cx={100} cy={34} r={20} {...deco} />
          <Rect x={90} y={52} width={20} height={14} rx={7} {...deco} />
          <Circle cx={27} cy={243} r={9} {...deco} />
          <Circle cx={173} cy={243} r={9} {...deco} />
          <Rect x={62} y={384} width={19} height={12} rx={5} {...deco} />
          <Rect x={119} y={384} width={19} height={12} rx={5} {...deco} />

          <Circle cx={61} cy={86} r={19} {...paint('shoulders')} />
          <Circle cx={139} cy={86} r={19} {...paint('shoulders')} />
          <Rect x={64} y={100} width={35} height={52} rx={15} {...paint('chest')} />
          <Rect x={101} y={100} width={35} height={52} rx={15} {...paint('chest')} />
          <Ellipse cx={40} cy={139} rx={15} ry={29} {...paint('biceps')} />
          <Ellipse cx={160} cy={139} rx={15} ry={29} {...paint('biceps')} />
          <Ellipse cx={29} cy={201} rx={12} ry={30} {...paint('forearms')} />
          <Ellipse cx={171} cy={201} rx={12} ry={30} {...paint('forearms')} />
          <Rect x={77} y={152} width={46} height={66} rx={14} {...paint('abs')} />
          <Rect x={61} y={157} width={13} height={58} rx={6.5} {...paint('obliques')} />
          <Rect x={126} y={157} width={13} height={58} rx={6.5} {...paint('obliques')} />
          <Rect x={63} y={222} width={33} height={104} rx={15} {...paint('quads')} />
          <Rect x={104} y={222} width={33} height={104} rx={15} {...paint('quads')} />
          <Ellipse cx={72} cy={350} rx={13} ry={26} {...paint('calves')} />
          <Ellipse cx={128} cy={350} rx={13} ry={26} {...paint('calves')} />
        </Svg>
        <Text style={[styles.label, { color: theme.sub }]}>Front</Text>
      </View>
      <View style={styles.figureWrap}>
        <Svg viewBox="0 0 200 440" style={styles.svg}>
          <Rect x={58} y={72} width={84} height={162} rx={32} {...deco} />
          <Rect x={30} y={104} width={22} height={132} rx={11} {...deco} transform="rotate(6 41 170)" />
          <Rect x={148} y={104} width={22} height={132} rx={11} {...deco} transform="rotate(-6 159 170)" />
          <Rect x={62} y={280} width={34} height={90} rx={16} {...deco} />
          <Rect x={104} y={280} width={34} height={90} rx={16} {...deco} />

          <Circle cx={100} cy={34} r={20} {...deco} />
          <Rect x={90} y={52} width={20} height={14} rx={7} {...deco} />
          <Circle cx={27} cy={243} r={9} {...deco} />
          <Circle cx={173} cy={243} r={9} {...deco} />
          <Rect x={62} y={420} width={19} height={12} rx={5} {...deco} />
          <Rect x={119} y={420} width={19} height={12} rx={5} {...deco} />

          <Path
            d="M100 60 L150 92 L100 120 L50 92 Z"
            {...paint('traps')}
            strokeWidth={10}
            strokeLinejoin="round"
          />
          <Circle cx={61} cy={86} r={19} {...paint('shoulders')} />
          <Circle cx={139} cy={86} r={19} {...paint('shoulders')} />
          <Path
            d="M56 112 Q96 126 90 196 L58 172 Z"
            {...paint('lats')}
            strokeWidth={8}
            strokeLinejoin="round"
          />
          <Path
            d="M144 112 Q104 126 110 196 L142 172 Z"
            {...paint('lats')}
            strokeWidth={8}
            strokeLinejoin="round"
          />
          <Ellipse cx={40} cy={139} rx={15} ry={29} {...paint('triceps')} />
          <Ellipse cx={160} cy={139} rx={15} ry={29} {...paint('triceps')} />
          <Ellipse cx={29} cy={201} rx={12} ry={30} {...paint('forearms')} />
          <Ellipse cx={171} cy={201} rx={12} ry={30} {...paint('forearms')} />
          <Rect x={79} y={198} width={42} height={32} rx={10} {...paint('lower_back')} />
          <Circle cx={80} cy={252} r={23} {...paint('glutes')} />
          <Circle cx={120} cy={252} r={23} {...paint('glutes')} />
          <Rect x={63} y={280} width={33} height={88} rx={15} {...paint('hamstrings')} />
          <Rect x={104} y={280} width={33} height={88} rx={15} {...paint('hamstrings')} />
          <Ellipse cx={72} cy={388} rx={13} ry={25} {...paint('calves')} />
          <Ellipse cx={128} cy={388} rx={13} ry={25} {...paint('calves')} />
        </Svg>
        <Text style={[styles.label, { color: theme.sub }]}>Back</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  figureWrap: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 190,
  },
  svg: {
    width: '100%',
    aspectRatio: 200 / 440,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -4,
  },
});
