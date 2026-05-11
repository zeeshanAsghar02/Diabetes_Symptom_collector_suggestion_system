const { withMainActivity } = require('@expo/config-plugins');

function addImportsIfMissing(src, importLines) {
  const missing = importLines.filter((line) => !src.includes(line));
  if (missing.length === 0) {
    return src;
  }

  // Kotlin/Java require package declaration to be first; imports must come after it.
  const packageMatch = src.match(/^(package[^\n]*\n)/m);
  if (!packageMatch) {
    return `${missing.join('\n')}\n${src}`;
  }

  const pkg = packageMatch[1];
  return src.replace(pkg, `${pkg}${missing.join('\n')}\n`);
}

function withHealthConnectDelegate(config) {
  return withMainActivity(config, (config) => {
    const src = config.modResults.contents;

    if (src.includes('HealthConnectPermissionDelegate.setPermissionDelegate(this)')) {
      return config;
    }

    const isKotlin = src.includes('class MainActivity') && src.includes(': ReactActivity()');

    if (isKotlin) {
      let next = src;
      next = addImportsIfMissing(next, [
        'import android.os.Bundle',
        'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate',
      ]);

      // Check if setPermissionDelegate call already exists
      if (!next.includes('HealthConnectPermissionDelegate.setPermissionDelegate(this)')) {
        // If onCreate exists, inject into it; otherwise create one
        if (next.includes('override fun onCreate(savedInstanceState: Bundle?)')) {
          // Inject the delegate call after super.onCreate(null)
          next = next.replace(
            /(\s+super\.onCreate\([^)]*\))/,
            '$1\n    HealthConnectPermissionDelegate.setPermissionDelegate(this)',
          );
        } else {
          // Create onCreate block if it doesn't exist
          const onCreateBlock = [
            '  override fun onCreate(savedInstanceState: Bundle?) {',
            '    super.onCreate(savedInstanceState)',
            '    HealthConnectPermissionDelegate.setPermissionDelegate(this)',
            '  }',
          ].join('\n');

          if (next.includes('override fun createReactActivityDelegate')) {
            next = next.replace(
              '  override fun createReactActivityDelegate(): ReactActivityDelegate =',
              `${onCreateBlock}\n\n  override fun createReactActivityDelegate(): ReactActivityDelegate =`,
            );
          } else {
            next = next.replace(/}\s*$/, `\n\n${onCreateBlock}\n}\n`);
          }
        }
      }

      config.modResults.contents = next;
      return config;
    }

    // Java template fallback
    let next = src;
    next = addImportsIfMissing(next, [
      'import android.os.Bundle;',
      'import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate;',
    ]);

    const javaOnCreate = [
      '  @Override',
      '  protected void onCreate(Bundle savedInstanceState) {',
      '    super.onCreate(savedInstanceState);',
      '    HealthConnectPermissionDelegate.setPermissionDelegate(this);',
      '  }',
      '',
    ].join('\n');

    if (!next.includes('protected void onCreate(Bundle savedInstanceState)')) {
      if (next.includes('@Override') && next.includes('protected String getMainComponentName()')) {
        next = next.replace(
          /@Override\s*\n\s*protected String getMainComponentName\(\)/,
          `${javaOnCreate}  @Override\n  protected String getMainComponentName()`,
        );
      } else {
        next = next.replace(/}\s*$/, `\n\n${javaOnCreate}}\n`);
      }
    }

    config.modResults.contents = next;
    return config;
  });
}

module.exports = withHealthConnectDelegate;
